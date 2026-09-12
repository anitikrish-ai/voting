-- ============================================================================
-- MLBB 5v5 Tournament Voting — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: guarded with IF NOT EXISTS / OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- TOURNAMENT (single row controlling global voting state)
-- ----------------------------------------------------------------------------
create table if not exists public.tournament (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'MLBB 5v5 Tournament',
  status text not null default 'open' check (status in ('open', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tournament (name, status)
select 'MLBB 5v5 Tournament', 'open'
where not exists (select 1 from public.tournament);

-- ----------------------------------------------------------------------------
-- PLAYERS
-- ----------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  role text,                         -- e.g. Jungler, Mid Laner, Roamer
  image_url text,
  sort_order int not null default 0,
  votes_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists players_sort_order_idx on public.players (sort_order);
create index if not exists players_votes_count_idx on public.players (votes_count desc);

-- ----------------------------------------------------------------------------
-- VOTERS (one anonymous device/browser identity per row)
-- ----------------------------------------------------------------------------
create table if not exists public.voters (
  id uuid primary key default gen_random_uuid(),
  voter_key text not null,
  created_at timestamptz not null default now(),
  last_vote_at timestamptz
);

-- The uniqueness guarantee that makes "one voter, one vote" bulletproof
-- even under concurrent/racing requests.
create unique index if not exists voters_voter_key_key on public.voters (voter_key);

-- ----------------------------------------------------------------------------
-- VOTES
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references public.voters (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- A voter can only ever have ONE vote row. This is the hard backstop against
-- duplicate votes / double-clicks / race conditions — enforced by Postgres,
-- not by application code.
create unique index if not exists votes_one_per_voter_key on public.votes (voter_id);
create index if not exists votes_player_id_idx on public.votes (player_id);

-- ----------------------------------------------------------------------------
-- ADMINS (maps a Supabase Auth user to admin privileges)
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- ATOMIC VOTE RPC
-- Runs as a single transaction so a duplicate/racing request can never create
-- two votes for the same voter or double-increment a player's score.
-- Called only from the server (API route) using the service-role key —
-- never exposed for direct anon RPC execution (see REVOKE below).
-- ----------------------------------------------------------------------------
create or replace function public.cast_vote(p_voter_key text, p_player_id uuid)
returns table (result text, player_id uuid, votes_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_voter_id uuid;
  v_new_count int;
begin
  select status into v_status from public.tournament order by created_at asc limit 1;
  if v_status is null then
    v_status := 'open';
  end if;

  if v_status <> 'open' then
    return query select 'voting_closed', p_player_id, 0;
    return;
  end if;

  if not exists (select 1 from public.players where id = p_player_id) then
    return query select 'invalid_player', p_player_id, 0;
    return;
  end if;

  -- Upsert the voter identity. ON CONFLICT relies on the unique index on
  -- voter_key, so concurrent first-time requests from the same device
  -- resolve to a single voter row instead of racing into two.
  insert into public.voters (voter_key)
  values (p_voter_key)
  on conflict (voter_key) do update set voter_key = excluded.voter_key
  returning id into v_voter_id;

  -- Attempt the vote insert. The unique index on votes.voter_id is the
  -- authoritative guard: if this voter already has a vote row, this insert
  -- raises unique_violation and we report "already_voted" instead of
  -- silently succeeding or double-counting.
  begin
    insert into public.votes (voter_id, player_id) values (v_voter_id, p_player_id);
  exception when unique_violation then
    return query select 'already_voted', p_player_id, 0;
    return;
  end;

  update public.voters set last_vote_at = now() where id = v_voter_id;

  update public.players
  set votes_count = votes_count + 1
  where id = p_player_id
  returning votes_count into v_new_count;

  return query select 'success', p_player_id, v_new_count;
end;
$$;

-- Only the server (service_role, which bypasses grants entirely) may execute
-- this. Anon/authenticated clients must never call it directly.
revoke all on function public.cast_vote(text, uuid) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- HAS THIS VOTER ALREADY VOTED? (safe read-only helper for the server route)
-- ----------------------------------------------------------------------------
create or replace function public.voter_status(p_voter_key text)
returns table (has_voted boolean, player_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select
    (v.id is not null and vt.id is not null) as has_voted,
    vt.player_id
  from (select p_voter_key as voter_key) k
  left join public.voters v on v.voter_key = k.voter_key
  left join public.votes vt on vt.voter_id = v.id;
$$;

revoke all on function public.voter_status(text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.tournament enable row level security;
alter table public.players enable row level security;
alter table public.voters enable row level security;
alter table public.votes enable row level security;
alter table public.admins enable row level security;

-- Public (anon) may read tournament status and player list/scores — that's
-- the minimum needed to render the voting page and leaderboard.
drop policy if exists "public read tournament" on public.tournament;
create policy "public read tournament" on public.tournament
  for select using (true);

drop policy if exists "public read players" on public.players;
create policy "public read players" on public.players
  for select using (true);

-- voters and votes contain identifying/behavioral data and are never
-- readable or writable directly by anon/authenticated clients. All access
-- goes through the SECURITY DEFINER RPCs above, called from the server with
-- the service-role key.
drop policy if exists "no public access voters" on public.voters;
drop policy if exists "no public access votes" on public.votes;

-- Admins (authenticated + present in public.admins) can update tournament
-- state and manage players from the admin panel.
drop policy if exists "admins manage tournament" on public.tournament;
create policy "admins manage tournament" on public.tournament
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage players" on public.players;
create policy "admins manage players" on public.players
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- REALTIME
-- Publish players + tournament so the client can subscribe to live changes.
-- (Votes/voters intentionally excluded — clients never see raw vote rows.)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table public.players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tournament'
  ) then
    alter publication supabase_realtime add table public.tournament;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- SEED — replace with your real 24 players before going live.
-- ----------------------------------------------------------------------------
insert into public.players (name, team, role, image_url, sort_order)
select * from (values
  ('Player One',   'Team Aurora',   'Gold Laner',  '/players/placeholder.svg', 1),
  ('Player Two',   'Team Aurora',   'Jungler',     '/players/placeholder.svg', 2),
  ('Player Three', 'Team Aurora',   'Mid Laner',   '/players/placeholder.svg', 3),
  ('Player Four',  'Team Aurora',   'Roamer',      '/players/placeholder.svg', 4),
  ('Player Five',  'Team Aurora',   'Exp Laner',   '/players/placeholder.svg', 5),
  ('Player Six',   'Team Vanguard', 'Gold Laner',  '/players/placeholder.svg', 6),
  ('Player Seven', 'Team Vanguard', 'Jungler',     '/players/placeholder.svg', 7),
  ('Player Eight', 'Team Vanguard', 'Mid Laner',   '/players/placeholder.svg', 8),
  ('Player Nine',  'Team Vanguard', 'Roamer',      '/players/placeholder.svg', 9),
  ('Player Ten',   'Team Vanguard', 'Exp Laner',   '/players/placeholder.svg', 10),
  ('Player Eleven','Team Obsidian', 'Gold Laner',  '/players/placeholder.svg', 11),
  ('Player Twelve','Team Obsidian', 'Jungler',     '/players/placeholder.svg', 12),
  ('Player Thirteen','Team Obsidian','Mid Laner',  '/players/placeholder.svg', 13),
  ('Player Fourteen','Team Obsidian','Roamer',     '/players/placeholder.svg', 14),
  ('Player Fifteen','Team Obsidian','Exp Laner',   '/players/placeholder.svg', 15),
  ('Player Sixteen','Team Solstice','Gold Laner',  '/players/placeholder.svg', 16),
  ('Player Seventeen','Team Solstice','Jungler',   '/players/placeholder.svg', 17),
  ('Player Eighteen','Team Solstice','Mid Laner',  '/players/placeholder.svg', 18),
  ('Player Nineteen','Team Solstice','Roamer',     '/players/placeholder.svg', 19),
  ('Player Twenty','Team Solstice', 'Exp Laner',   '/players/placeholder.svg', 20),
  ('Player Twenty-One','Team Ironclad','Gold Laner','/players/placeholder.svg', 21),
  ('Player Twenty-Two','Team Ironclad','Jungler',   '/players/placeholder.svg', 22),
  ('Player Twenty-Three','Team Ironclad','Mid Laner','/players/placeholder.svg', 23),
  ('Player Twenty-Four','Team Ironclad','Roamer',   '/players/placeholder.svg', 24)
) as seed(name, team, role, image_url, sort_order)
where not exists (select 1 from public.players);
