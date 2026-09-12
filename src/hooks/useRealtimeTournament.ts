"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player, Tournament, TournamentStatus } from "@/lib/types";

/**
 * One Supabase Realtime channel, shared by every consumer of this hook on
 * the page, covering both tables the UI needs live: players (score changes)
 * and tournament (status changes). Reconnects handled by the client SDK;
 * we just re-subscribe on mount/unmount.
 */
export function useRealtimeTournament(initialPlayers: Player[], initialStatus: TournamentStatus) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [status, setStatus] = useState<TournamentStatus>(initialStatus);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel("tournament-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "players" },
        (payload) => {
          const updated = payload.new as Player;
          setPlayers((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, votes_count: updated.votes_count } : p))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tournament" },
        (payload) => {
          const updated = payload.new as Tournament;
          setStatus(updated.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { players, status };
}
