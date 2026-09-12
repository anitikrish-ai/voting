"use client";

import { useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRealtimeTournament } from "@/hooks/useRealtimeTournament";
import { RankBadge } from "@/components/RankBadge";
import { StatusPill } from "@/components/StatusPill";
import type { Player, TournamentStatus } from "@/lib/types";
import { EASE_STANDARD } from "@/lib/motion";

export function LeaderboardClient({
  initialPlayers,
  initialStatus,
}: {
  initialPlayers: Player[];
  initialStatus: TournamentStatus;
}) {
  const { players, status } = useRealtimeTournament(initialPlayers, initialStatus);
  const prevCounts = useRef<Map<string, number>>(new Map(initialPlayers.map((p) => [p.id, p.votes_count])));

  const ranked = useMemo(
    () => [...players].sort((a, b) => b.votes_count - a.votes_count || a.name.localeCompare(b.name)),
    [players]
  );

  const totalVotes = useMemo(() => players.reduce((sum, p) => sum + p.votes_count, 0), [players]);
  const leader = ranked[0];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Votes" value={totalVotes.toLocaleString()} />
        <StatCard label="Current Leader" value={leader?.name ?? "—"} accent />
        <div className="col-span-2 flex items-center sm:col-span-1">
          <StatusPill status={status} />
        </div>
      </div>

      <motion.ol layout className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {ranked.map((player, index) => {
            const bumped = (prevCounts.current.get(player.id) ?? player.votes_count) !== player.votes_count;
            prevCounts.current.set(player.id, player.votes_count);
            const pct = totalVotes > 0 ? Math.round((player.votes_count / totalVotes) * 100) : 0;

            return (
              <motion.li
                key={player.id}
                layout
                transition={{ duration: 0.5, ease: EASE_STANDARD }}
                className="relative flex items-center gap-3 overflow-hidden border px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3"
                style={{
                  borderColor: index === 0 ? "var(--gold)" : "var(--line)",
                  background: "var(--panel)",
                }}
              >
                <RankBadge rank={index + 1} />

                <div className="relative h-11 w-11 shrink-0 overflow-hidden border sm:h-12 sm:w-12" style={{ borderColor: "var(--line-strong)" }}>
                  <Image
                    src={player.image_url || "/players/placeholder.svg"}
                    alt={player.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm sm:text-base" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                    {player.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--text-dim)" }}>
                    {player.team}
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

                <motion.span
                  key={player.votes_count}
                  initial={bumped ? { opacity: 0, y: -6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_STANDARD }}
                  className="shrink-0 text-lg tabular-nums sm:text-2xl"
                  style={{ fontFamily: "var(--font-display)", color: index === 0 ? "var(--gold-bright)" : "var(--text)" }}
                >
                  {player.votes_count}
                </motion.span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ol>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border px-3 py-3 sm:px-4 sm:py-4" style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}>
      <p className="text-[10px] uppercase tracking-[0.1em] sm:text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
      <p
        className="mt-1 truncate text-lg sm:text-2xl"
        style={{ fontFamily: "var(--font-display)", color: accent ? "var(--gold-bright)" : "var(--text)" }}
      >
        {value}
      </p>
    </div>
  );
}
