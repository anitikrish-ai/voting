export function RankBadge({ rank }: { rank: number }) {
  const isTop = rank === 1;
  return (
    <div
      className="relative flex h-10 w-10 shrink-0 items-center justify-center border sm:h-12 sm:w-12"
      style={{
        borderColor: isTop ? "var(--gold)" : "var(--line-strong)",
        background: isTop ? "var(--gold)" : "var(--panel-inset)",
        color: isTop ? "var(--ink)" : "var(--text-dim)",
      }}
    >
      <span
        className="font-[var(--font-display)] text-lg leading-none sm:text-xl"
        style={{ letterSpacing: "-0.02em" }}
      >
        {String(rank).padStart(2, "0")}
      </span>
    </div>
  );
}
