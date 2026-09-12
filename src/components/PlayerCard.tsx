"use client";

import { motion } from "framer-motion";
import type { Player } from "@/lib/types";
import { cardEnter } from "@/lib/motion";

interface PlayerCardProps {
  player: Player;
  selected: boolean;
  fadedOut: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}

export function PlayerCard({ player, selected, fadedOut, disabled, onSelect }: PlayerCardProps) {
  return (
    <motion.button
      type="button"
      variants={cardEnter}
      onClick={() => onSelect(player.id)}
      disabled={disabled}
      aria-pressed={selected}
      className="group relative w-full overflow-hidden border text-left transition-colors focus-visible:outline-none disabled:cursor-not-allowed"
      style={{
        borderColor: selected ? "var(--gold)" : "var(--line)",
        background: "var(--panel)",
        opacity: fadedOut ? 0.4 : 1,
        transitionDuration: "var(--dur-fast)",
      }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {/* Top accent bar — gold when selected, steel when not */}
      <div
        className="h-1 w-full transition-colors"
        style={{
          background: selected ? "var(--gold)" : "var(--blue-steel)",
          transitionDuration: "var(--dur-fast)",
        }}
      />

      {/* Light sweep on hover — desktop only */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden -translate-x-full opacity-0 transition-all group-hover:translate-x-full group-hover:opacity-100 sm:block"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(232,200,120,0.10) 50%, transparent 60%)",
          transitionDuration: "700ms",
          transitionTimingFunction: "var(--ease-standard)",
        }}
      />

      {/* Selected check badge */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 8.5L6 12.5L14 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
        </motion.div>
      )}

      {/* Card body — name, role, team */}
      <div className="flex flex-col gap-0.5 px-3 py-3 sm:px-3.5 sm:py-4">
        {/* Team tag */}
        <p
          className="truncate text-[10px] uppercase tracking-[0.08em] sm:text-[11px]"
          style={{ fontFamily: "var(--font-display)", color: "var(--blue-glow)" }}
        >
          {player.team}
        </p>

        {/* Player name */}
        <h3
          className="truncate text-base leading-tight sm:text-lg"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          {player.name}
        </h3>

        {/* Role */}
        {player.role && (
          <p className="mt-0.5 truncate text-xs sm:text-sm" style={{ color: "var(--text-dim)" }}>
            {player.role}
          </p>
        )}
      </div>
    </motion.button>
  );
}
