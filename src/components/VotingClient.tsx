"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlayerCard } from "@/components/PlayerCard";
import { StatusPill } from "@/components/StatusPill";
import type { Player, TournamentStatus } from "@/lib/types";
import { staggerContainer, fadeIn, DUR, EASE_DECEL } from "@/lib/motion";

type Phase = "loading" | "voting" | "confirming" | "submitting" | "done" | "already_voted";

export function VotingClient({
  players,
  initialStatus,
}: {
  players: Player[];
  initialStatus: TournamentStatus;
}) {
  const [status] = useState<TournamentStatus>(initialStatus);
  const [phase, setPhase] = useState<Phase>("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [votedPlayerId, setVotedPlayerId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voter")
      .then((r) => r.json())
      .then((data: { hasVoted: boolean; playerId: string | null }) => {
        if (cancelled) return;
        if (data.hasVoted) {
          setVotedPlayerId(data.playerId);
          setPhase("already_voted");
        } else {
          setPhase("voting");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("voting");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedId) ?? null,
    [players, selectedId]
  );
  const votedPlayer = useMemo(
    () => players.find((p) => p.id === votedPlayerId) ?? null,
    [players, votedPlayerId]
  );

  function handleSelect(id: string) {
    if (phase !== "voting" && phase !== "confirming") return;
    setSelectedId(id);
    setPhase("confirming");
    setErrorMsg(null);
  }

  async function handleConfirm() {
    if (!selectedId || phase === "submitting") return; // guard double-click
    setPhase("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedId }),
      });
      const data = await res.json();

      if (data.result === "success") {
        setVotedPlayerId(selectedId);
        setPhase("done");
      } else if (data.result === "already_voted") {
        setVotedPlayerId(data.playerId ?? selectedId);
        setPhase("already_voted");
      } else {
        setErrorMsg(data.message || "Your vote could not be recorded.");
        setPhase("confirming");
      }
    } catch {
      setErrorMsg("Network error — please check your connection and try again.");
      setPhase("confirming");
    }
  }

  const votingDisabled = status !== "open";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
          Loading ballot…
        </span>
      </div>
    );
  }

  // ── Vote recorded / already voted ─────────────────────────────────────────
  if (phase === "already_voted" || phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.slow, ease: EASE_DECEL }}
        className="mx-auto max-w-md border px-6 py-10 text-center sm:px-10"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
      >
        {/* Top accent */}
        <div
          className="mx-auto mb-6 h-1 w-16"
          style={{ background: "var(--gold)" }}
          aria-hidden
        />

        <p
          className="text-xs uppercase tracking-[0.14em]"
          style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}
        >
          {phase === "done" ? "Vote Recorded" : "Already Voted"}
        </p>

        {votedPlayer ? (
          <>
            <h2
              className="mt-4 text-2xl sm:text-3xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
            >
              {votedPlayer.name}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--blue-glow)", fontFamily: "var(--font-display)" }}>
              {votedPlayer.team}
            </p>
            {votedPlayer.role && (
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {votedPlayer.role}
              </p>
            )}
          </>
        ) : (
          <h2
            className="mt-4 text-xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            Your vote is in
          </h2>
        )}

        <p className="mt-6 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
          This device has cast its one vote for the tournament. Follow the live standings on the
          leaderboard.
        </p>
        <a
          href="/leaderboard"
          className="mt-6 inline-block border px-6 py-3 text-sm uppercase tracking-[0.08em] transition-colors"
          style={{
            borderColor: "var(--gold)",
            color: "var(--gold-bright)",
            fontFamily: "var(--font-display)",
            transitionDuration: "var(--dur-fast)",
          }}
        >
          View Live Standings
        </a>
      </motion.div>
    );
  }

  // ── Ballot ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-28 sm:pb-32">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Select one player, then confirm. One vote per device.
        </p>
        <StatusPill status={status} />
      </div>

      {votingDisabled && (
        <div
          className="mb-6 border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--line-strong)",
            background: "var(--panel)",
            color: "var(--text-dim)",
          }}
        >
          Voting is not currently open for this tournament. Check back soon.
        </div>
      )}

      <motion.div
        variants={staggerContainer(35)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
      >
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            selected={selectedId === player.id}
            fadedOut={Boolean(selectedId) && selectedId !== player.id}
            disabled={votingDisabled || phase === "submitting"}
            onSelect={handleSelect}
          />
        ))}
      </motion.div>

      {/* Sticky confirm tray */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_DECEL }}
            className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-4 sm:px-8"
            style={{
              borderColor: "var(--line-strong)",
              background: "rgba(10,12,16,0.96)",
            }}
          >
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="text-[11px] uppercase tracking-[0.1em]"
                  style={{ color: "var(--text-faint)" }}
                >
                  Your selection
                </p>
                <p
                  className="truncate text-lg"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--gold-bright)",
                  }}
                >
                  {selectedPlayer.name}
                  <span
                    className="ml-2 text-sm"
                    style={{
                      color: "var(--text-dim)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {selectedPlayer.team}
                  </span>
                </p>
                {errorMsg && (
                  <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                    {errorMsg}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setPhase("voting");
                    setErrorMsg(null);
                  }}
                  disabled={phase === "submitting"}
                  className="border px-4 py-3 text-sm uppercase tracking-[0.06em] disabled:opacity-40"
                  style={{
                    borderColor: "var(--line-strong)",
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={phase === "submitting" || votingDisabled}
                  className="min-w-[140px] border px-5 py-3 text-sm uppercase tracking-[0.06em] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: "var(--gold)",
                    background: "var(--gold)",
                    color: "var(--ink)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {phase === "submitting" ? "Submitting…" : "Confirm Vote"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeIn} initial="hidden" animate="show" />
    </div>
  );
}
