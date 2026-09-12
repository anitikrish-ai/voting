import type { TournamentStatus } from "@/lib/types";

const COPY: Record<TournamentStatus, string> = {
  open: "Voting Open",
  paused: "Voting Paused",
  closed: "Voting Closed",
};

const COLOR: Record<TournamentStatus, string> = {
  open: "var(--success)",
  paused: "var(--gold)",
  closed: "var(--danger)",
};

export function StatusPill({ status }: { status: TournamentStatus }) {
  return (
    <div
      className="inline-flex items-center gap-2 border px-3 py-1.5"
      style={{ borderColor: "var(--line-strong)", background: "var(--panel-inset)" }}
    >
      <span
        className="h-1.5 w-1.5"
        style={{ background: COLOR[status] }}
        aria-hidden
      />
      <span
        className="text-xs tracking-wide"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-dim)" }}
      >
        {COPY[status]}
      </span>
    </div>
  );
}
