import Link from "next/link";

export function SiteHeader({ tournamentName }: { tournamentName: string }) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ borderColor: "var(--line)", background: "rgba(10,12,16,0.92)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2" style={{ background: "var(--gold)" }} aria-hidden />
          <span
            className="text-sm uppercase tracking-[0.14em] sm:text-base"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            {tournamentName}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-[0.08em] sm:gap-6 sm:text-sm">
          <Link
            href="/"
            className="transition-colors"
            style={{ color: "var(--text-dim)", fontFamily: "var(--font-display)" }}
          >
            Vote
          </Link>
          <Link
            href="/leaderboard"
            className="transition-colors"
            style={{ color: "var(--text-dim)", fontFamily: "var(--font-display)" }}
          >
            Standings
          </Link>
        </nav>
      </div>
    </header>
  );
}
