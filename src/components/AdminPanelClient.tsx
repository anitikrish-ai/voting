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

// Per-player editing state
interface EditState {
  value: string;        // current input text
  saving: boolean;
  error: string | null;
  saved: boolean;       // flash confirmation
}

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

  // Local name edits — keyed by player id
  const [edits, setEdits] = useState<Record<string, EditState>>({});

  const ranked = useMemo(
    () =>
      [...players].sort(
        (a, b) => b.votes_count - a.votes_count || a.name.localeCompare(b.name)
      ),
    [players]
  );
  const totalVotes = useMemo(
    () => players.reduce((s, p) => s + p.votes_count, 0),
    [players]
  );
  const leader = ranked[0];

  // ── Tournament status toggle ─────────────────────────────────────────────
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

  // ── Logout ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  // ── Player name editing helpers ──────────────────────────────────────────
  function getEditValue(player: Player): string {
    return edits[player.id]?.value ?? player.name;
  }

  function startEdit(player: Player, value: string) {
    setEdits((prev) => {
      const existing = prev[player.id];
      return {
        ...prev,
        [player.id]: {
          saving: existing?.saving ?? false,
          error: existing?.error ?? null,
          saved: existing?.saved ?? false,
          value, // always apply the new value
        },
      };
    });
  }

  function patchEdit(id: string, patch: Partial<EditState>) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function saveName(player: Player) {
    const value = getEditValue(player).trim();

    if (!value) {
      patchEdit(player.id, { error: "Name cannot be empty." });
      return;
    }
    if (value === player.name) {
      // No change — clear any error and mark clean
      patchEdit(player.id, { error: null });
      return;
    }
    if (edits[player.id]?.saving) return; // prevent double-save

    patchEdit(player.id, { saving: true, error: null, saved: false });

    try {
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        patchEdit(player.id, {
          saving: false,
          error: data?.message || "Save failed.",
        });
        return;
      }

      // Success — clear the local override so realtime data drives the UI
      setEdits((prev) => {
        const next = { ...prev };
        delete next[player.id];
        return next;
      });

      // Flash "Saved" briefly by restoring the edit row with saved=true
      // and cleared value (realtime will update player.name)
      setEdits((prev) => ({
        ...prev,
        [player.id]: {
          value: data?.player?.name ?? value,
          saving: false,
          error: null,
          saved: true,
        },
      }));
      setTimeout(() => {
        setEdits((prev) => {
          const next = { ...prev };
          delete next[player.id];
          return next;
        });
      }, 1800);

      router.refresh(); // re-fetch server data so stale props don't override
    } catch {
      patchEdit(player.id, {
        saving: false,
        error: "Network error — try again.",
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.14em]"
            style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}
          >
            Tournament Control
          </p>
          <h1
            className="mt-1 text-3xl sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            Command Center
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="border px-4 py-2.5 text-xs uppercase tracking-[0.08em]"
          style={{
            borderColor: "var(--line-strong)",
            color: "var(--text-dim)",
            fontFamily: "var(--font-display)",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Votes" value={totalVotes.toLocaleString()} />
        <Stat label="Current Leader" value={leader?.name ?? "—"} accent />
        <Stat label="Players" value={String(players.length)} />
        <Stat label="Status" value={status} />
      </div>

      {/* Tournament status controls */}
      <div
        className="mb-10 border px-4 py-4 sm:px-6 sm:py-5"
        style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
      >
        <p
          className="mb-3 text-xs uppercase tracking-[0.1em]"
          style={{ color: "var(--text-faint)" }}
        >
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

      {/* Player name editing + rankings */}
      <p
        className="mb-3 text-xs uppercase tracking-[0.1em]"
        style={{ color: "var(--text-faint)" }}
      >
        Players — Edit Names &amp; Live Rankings
      </p>

      <motion.ol
        variants={staggerContainer(20)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2"
      >
        {ranked.map((player, index) => {
          const pct = totalVotes > 0 ? Math.round((player.votes_count / totalVotes) * 100) : 0;
          const editState = edits[player.id];
          const currentValue = editState?.value ?? player.name;
          const isSaving = editState?.saving ?? false;
          const isSaved = editState?.saved ?? false;
          const editError = editState?.error ?? null;
          const isDirty = currentValue.trim() !== player.name && !isSaved;

          return (
            <motion.li
              key={player.id}
              layout
              variants={cardEnter}
              transition={{ layout: { duration: 0.5, ease: EASE_STANDARD } }}
              className="border px-3 py-3 sm:px-4"
              style={{
                borderColor: index === 0 ? "var(--gold)" : "var(--line)",
                background: "var(--panel)",
              }}
            >
              {/* Top row: rank + name editor + score */}
              <div className="flex items-center gap-3">
                <RankBadge rank={index + 1} />

                {/* Inline name editor */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => startEdit(player, e.target.value)}
                      onBlur={() => {
                        // Auto-save on blur if changed
                        if (isDirty) saveName(player);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveName(player);
                        }
                        if (e.key === "Escape") {
                          setEdits((prev) => {
                            const next = { ...prev };
                            delete next[player.id];
                            return next;
                          });
                        }
                      }}
                      disabled={isSaving}
                      aria-label={`Edit name for player rank ${index + 1}`}
                      className="min-w-0 flex-1 border-b bg-transparent pb-0.5 text-sm outline-none transition-colors"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--text)",
                        borderColor: editError
                          ? "var(--danger)"
                          : isDirty
                          ? "var(--gold)"
                          : "transparent",
                        transitionDuration: "var(--dur-fast)",
                      }}
                    />
                    {/* Save button — only visible when dirty */}
                    {(isDirty || isSaving) && (
                      <button
                        type="button"
                        onClick={() => saveName(player)}
                        disabled={isSaving}
                        className="shrink-0 border px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] disabled:opacity-50"
                        style={{
                          borderColor: "var(--gold)",
                          background: "var(--gold)",
                          color: "var(--ink)",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {isSaving ? "…" : "Save"}
                      </button>
                    )}
                    {/* Saved flash */}
                    {isSaved && (
                      <span
                        className="shrink-0 text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--success)", fontFamily: "var(--font-display)" }}
                      >
                        ✓ Saved
                      </span>
                    )}
                  </div>

                  {/* Team / role sub-line */}
                  <p
                    className="mt-0.5 truncate text-xs"
                    style={{ color: "var(--text-dim)", fontFamily: "var(--font-body)" }}
                  >
                    {player.team}
                    {player.role ? ` · ${player.role}` : ""}
                  </p>

                  {/* Error */}
                  {editError && (
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--danger)" }}>
                      {editError}
                    </p>
                  )}
                </div>

                {/* Vote count */}
                <span
                  className="shrink-0 text-lg tabular-nums"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
                >
                  {player.votes_count}
                </span>
                <span
                  className="hidden w-12 shrink-0 text-right text-xs tabular-nums sm:block"
                  style={{ color: "var(--text-faint)" }}
                >
                  {pct}%
                </span>
              </div>

              {/* Vote bar */}
              <div
                className="mt-2.5 ml-[52px] h-1 overflow-hidden sm:ml-[60px]"
                style={{ background: "var(--line)" }}
              >
                <motion.div
                  className="h-full"
                  style={{
                    background: index === 0 ? "var(--gold)" : "var(--blue-steel)",
                  }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: EASE_STANDARD }}
                />
              </div>
            </motion.li>
          );
        })}
      </motion.ol>

      <p
        className="mt-4 text-xs"
        style={{ color: "var(--text-faint)" }}
      >
        Click any player name to edit. Press Enter or click Save to apply. Changes are saved to Supabase immediately.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="border px-3 py-3 sm:px-4 sm:py-4"
      style={{ borderColor: "var(--line-strong)", background: "var(--panel)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.1em] sm:text-xs"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 truncate text-lg capitalize sm:text-2xl"
        style={{
          fontFamily: "var(--font-display)",
          color: accent ? "var(--gold-bright)" : "var(--text)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
