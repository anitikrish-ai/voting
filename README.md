# MLBB 5v5 Tournament — Fan Vote

Next.js (App Router) + Supabase voting platform for a 24-player MLBB tournament.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase: Postgres + Auth + Realtime, RLS-secured
- Framer Motion for the motion system

## 1. Create the Supabase project

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`. It creates `players`,
   `voters`, `votes`, `tournament`, `admins`, the atomic `cast_vote` /
   `voter_status` RPCs, RLS policies, realtime publication, and a 24-player
   placeholder seed.
3. Replace the placeholder seed rows in `players` with your real roster
   (name, team, role, `image_url`, `sort_order`) and upload portraits to
   Supabase Storage or `/public/players`.
4. Create your admin account: Authentication → Add user, then insert a row
   into `public.admins` with that user's `id`.

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It's read exclusively inside
`src/app/api/**/route.ts` handlers and must never be prefixed with
`NEXT_PUBLIC_` or imported into a client component.

## 3. Fonts (read before shipping)

The brief calls for **Coolvetica Rg.otf** and **AppleGaramond**. Both are
commercial faces — no license was available to verify in this build, so no
font binaries are bundled. To use the real fonts:

1. Confirm you hold a webfont license covering this deployment.
2. Drop the files into `public/fonts/` as:
   - `Coolvetica Rg.otf`
   - `AppleGaramond-Light.ttf`
   - `AppleGaramond.ttf`

They'll be picked up automatically by the `@font-face` rules in
`src/app/globals.css` — no code changes needed. Until then, the site renders
with a close visual fallback (condensed display / oldstyle serif).

## 4. Run

```
npm install
npm run dev
```

## How the anti-duplicate-vote system works

- A voter identity is a random UUID set in an **httpOnly cookie** on first
  visit (`src/lib/voter.ts`) — not localStorage, so page JS can't read or
  forge it.
- The vote itself is written by `cast_vote(...)`, a single Postgres
  transaction (`supabase/schema.sql`) that upserts the voter row and inserts
  the vote. A **UNIQUE index on `votes.voter_id`** is the actual guarantee:
  even two simultaneous requests from the same device can only ever produce
  one row — the loser gets `already_voted` back, not a silent duplicate.
- The player's `votes_count` is incremented inside that same transaction, so
  a vote and its score bump are atomic.
- The RPCs are `REVOKE`d from `anon`/`authenticated` and only callable with
  the service-role key from the `/api/vote` route handler — never directly
  from the browser.

## Realtime

Both the leaderboard and the admin panel open a single Supabase Realtime
channel (`src/hooks/useRealtimeTournament.ts`) subscribed to `UPDATE`s on
`players` and `tournament`. No polling, no per-row subscriptions.

## Admin auth

`/admin/**` is gated by `src/middleware.ts` (requires a Supabase Auth
session) and, on the page itself, a second server-side check that the user
exists in `public.admins` — matching the `is_admin()` check Postgres RLS
enforces independently on `tournament`/`players` writes.
