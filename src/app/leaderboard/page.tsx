import { createPublicServerClient } from "@/lib/supabase/publicServer";
import { SiteHeader } from "@/components/SiteHeader";
import { LeaderboardClient } from "@/components/LeaderboardClient";
import type { Player, Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData(): Promise<{ players: Player[]; tournament: Tournament } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = createPublicServerClient();
  const [{ data: players }, { data: tournament }] = await Promise.all([
    supabase.from("players").select("*").order("votes_count", { ascending: false }),
    supabase.from("tournament").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (!tournament) return null;
  return { players: players ?? [], tournament };
}

export default async function LeaderboardPage() {
  const data = await getData();

  if (!data) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center px-6">
        <p style={{ color: "var(--text-dim)" }}>Connect Supabase to view live standings.</p>
      </main>
    );
  }

  return (
    <>
      <SiteHeader tournamentName={data.tournament.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <p
          className="text-xs uppercase tracking-[0.18em] sm:text-sm"
          style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}
        >
          Live Standings
        </p>
        <h1
          className="mt-2 mb-8 text-3xl leading-[0.95] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          Fan Vote Rankings
        </h1>
        <LeaderboardClient initialPlayers={data.players} initialStatus={data.tournament.status} />
      </main>
    </>
  );
}
