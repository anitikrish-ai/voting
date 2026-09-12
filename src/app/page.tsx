import { createPublicServerClient } from "@/lib/supabase/publicServer";
import { SiteHeader } from "@/components/SiteHeader";
import { VotingClient } from "@/components/VotingClient";
import type { Player, Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData(): Promise<{ players: Player[]; tournament: Tournament } | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = createPublicServerClient();

  const [{ data: players, error: playersError }, { data: tournament, error: tournamentError }] =
    await Promise.all([
      supabase.from("players").select("*").order("sort_order", { ascending: true }),
      supabase.from("tournament").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    ]);

  if (playersError || tournamentError || !tournament) {
  console.error("PLAYERS ERROR:", playersError);
  console.error("TOURNAMENT ERROR:", tournamentError);
  return null;
}
  return { players: players ?? [], tournament };
}

export default async function HomePage() {
  const data = await getData();

  if (!data) {
    return <SetupNotice />;
  }

  return (
    <>
      <SiteHeader tournamentName={data.tournament.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <section className="mb-10 sm:mb-14">
          <p
            className="text-xs uppercase tracking-[0.18em] sm:text-sm"
            style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}
          >
            Fan Vote — 5v5 Roster
          </p>
          <h1
            className="mt-2 text-4xl leading-[0.95] sm:text-6xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            {data.tournament.name}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-dim)" }}>
            Twenty-four competitors, one standout. Pick the player you want to see carry the finals —
            your device gets a single vote.
          </p>
        </section>

        <VotingClient players={data.players} initialStatus={data.tournament.status} />
      </main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  return (
    <footer
      className="border-t px-4 py-6 text-center text-xs sm:px-8"
      style={{ borderColor: "var(--line)", color: "var(--text-faint)" }}
    >
      One vote per device, verified server-side. Results update live on the standings page.
    </footer>
  );
}

function SetupNotice() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6" style={{ background: "var(--ink)" }}>
      <div
        className="max-w-md border px-6 py-8 text-center"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
      >
        <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
          Setup Required
        </p>
        <h1 className="mt-3 text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
          Connect Supabase
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> to your environment, run{" "}
          <code>supabase/schema.sql</code> against your project, then reload.
        </p>
      </div>
    </main>
  );
}
