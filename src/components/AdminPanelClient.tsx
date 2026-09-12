"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTournament } from "@/hooks/useRealtimeTournament";
import { RankBadge } from "@/components/RankBadge";
import type { Player, TournamentStatus } from "@/lib/types";
import { EASE_STANDARD, staggerContainer, cardEnter } from "@/lib/motion";

const STATUSES: TournamentStatus[] = ["open", "paused", "closed"];

export function AdminPanelClient({
  initialPlayers,
  initialStatus,
}: {
  initialPlayers: Player[];
  initialStatus: TournamentStatus;
}) {
  const { players, status } = useRealtimeTournament(initialPlayers, initialStatus);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const ranked = useMemo(
    () => [...players].sort((a, b) => b.votes_count - a.votes_count || a.name.localeCompare(b.name)),
    [players]
  );
  const totalVotes = useMemo(() => players.reduce((s, p) => s + p.votes_count, 0), [players]);
  const leader = ranked[0];

  function setStatus(next: TournamentStatus) {
    setActionError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(data?.message || "Could not update tournament status.");
      }
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
            Tournament Control
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            Command Center
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="border px-4 py-2.5 text-xs uppercase tracking-[0.08em]"
          style={{ borderColor: "var(--line-strong)", color: "var(--text-dim)", fontFamily: "var(--font-display)" }}
        >
          Sign Out
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Votes" value={totalVotes.toLocaleString()} />
        <Stat label="Current Leader" value={leader?.name ?? "—"} accent />
        <Stat label="Players" value={String(players.length)} />
        <Stat label="Status" value={status} />
      </div>

      <div className="mb-10 border px-4 py-4 sm:px-6 sm:py-5" style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}>
        <p className="mb-3 text-xs uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
          Voting State
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={pending || status === s}
              className="border px-4 py-2.5 text-xs uppercase tracking-[0.08em] transition-opacity disabled:cursor-not-allowed"
              style={{
                borderColor: status === s ? "var(--gold)" : "var(--line-strong)",
                background: status === s ? "var(--gold)" : "transparent",
                color: status === s ? "var(--ink)" : "var(--text-dim)",
                fontFamily: "var(--font-display)",
                opacity: pending && status !== s ? 0.5 : 1,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {actionError && (
          <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>
            {actionError}
          </p>
        )}
      </div>

      <p className="mb-3 text-xs uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
        Live Rankings
      </p>
      <motion.ol variants={staggerContainer(20)} initial="hidden" animate="show" className="flex flex-col gap-2">
        {ranked.map((player, index) => {
          const pct = totalVotes > 0 ? Math.round((player.votes_count / totalVotes) * 100) : 0;
          return (
            <motion.li
              key={player.id}
              layout
              variants={cardEnter}
              transition={{ layout: { duration: 0.5, ease: EASE_STANDARD } }}
              className="flex items-center gap-3 border px-3 py-2.5 sm:px-4"
              style={{ borderColor: index === 0 ? "var(--gold)" : "var(--line)", background: "var(--panel)" }}
            >
              <RankBadge rank={index + 1} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                  {player.name}
                  <span className="ml-2 text-xs" style={{ color: "var(--text-dim)", fontFamily: "var(--font-body)" }}>
                    {player.team}
                  </span>
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden" style={{ background: "var(--line)" }}>
                  <motion.div
                    className="h-full"
                    style={{ background: index === 0 ? "var(--gold)" : "var(--blue-steel)" }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: EASE_STANDARD }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-lg tabular-nums" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                {player.votes_count}
              </span>
              <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums sm:block" style={{ color: "var(--text-faint)" }}>
                {pct}%
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border px-3 py-3 sm:px-4 sm:py-4" style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}>
      <p className="text-[10px] uppercase tracking-[0.1em] sm:text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
      <p
        className="mt-1 truncate text-lg capitalize sm:text-2xl"
        style={{ fontFamily: "var(--font-display)", color: accent ? "var(--gold-bright)" : "var(--text)" }}
      >
        {value}
      </p>
    </div>
  );
}
