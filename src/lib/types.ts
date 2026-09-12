export type TournamentStatus = "open" | "paused" | "closed";

export interface Player {
  id: string;
  name: string;
  team: string;
  role: string | null;
  image_url: string | null;
  sort_order: number;
  votes_count: number;
}

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  updated_at: string;
}
