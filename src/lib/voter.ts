import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const VOTER_COOKIE = "mlbb_voter_key";

/**
 * Returns the current request's voter identifier, creating and persisting
 * one via an httpOnly cookie on first visit if it doesn't exist yet.
 *
 * This lives server-side deliberately: an httpOnly cookie can't be read or
 * forged by page JavaScript, unlike localStorage. It is still only a
 * convenience identifier — the database's UNIQUE constraint on
 * votes.voter_id is what actually prevents duplicate votes, not this value.
 */
export async function getOrCreateVoterKey(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VOTER_COOKIE)?.value;
  if (existing) return existing;

  const key = randomUUID();
  cookieStore.set(VOTER_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year — long enough to outlive the event
  });
  return key;
}

export async function readVoterKey(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(VOTER_COOKIE)?.value ?? null;
}
