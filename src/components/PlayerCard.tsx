"use client";

import Image from "next/image";
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
      {/* Portrait */}
      <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: "var(--panel-inset)" }}>
        <Image
          src={player.image_url || "/players/placeholder.svg"}
          alt={player.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          loading="lazy"
          className="object-cover transition-transform will-change-transform group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
          style={{ transitionDuration: "var(--dur-base)", transitionTimingFunction: "var(--ease-standard)" }}
        />

        {/* Light sweep on hover — desktop only, restrained, one diagonal pass */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden -translate-x-full opacity-0 transition-all group-hover:translate-x-full group-hover:opacity-100 sm:block"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(232,200,120,0.16) 50%, transparent 60%)",
            transitionDuration: "700ms",
            transitionTimingFunction: "var(--ease-standard)",
          }}
        />

        {/* Selected state overlay */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-start justify-end p-2"
            style={{
              boxShadow: "inset 0 0 0 2px var(--gold)",
              background: "linear-gradient(180deg, rgba(201,169,97,0.14), transparent 40%)",
            }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ background: "var(--gold)", color: "var(--ink)" }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 8.5L6 12.5L14 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </span>
          </motion.div>
        )}

        {/* Team tag */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5"
          style={{ background: "linear-gradient(180deg, transparent, rgba(10,12,16,0.92) 60%)" }}
        >
          <p
            className="truncate text-[10px] uppercase tracking-[0.08em] sm:text-[11px]"
            style={{ fontFamily: "var(--font-display)", color: "var(--blue-glow)" }}
          >
            {player.team}
          </p>
        </div>
      </div>

      {/* Name / role */}
      <div className="px-2.5 py-2 sm:px-3 sm:py-2.5">
        <h3
          className="truncate text-base leading-tight sm:text-lg"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          {player.name}
        </h3>
        {player.role && (
          <p className="mt-0.5 truncate text-xs sm:text-sm" style={{ color: "var(--text-dim)" }}>
            {player.role}
          </p>
        )}
      </div>
    </motion.button>
  );
}
