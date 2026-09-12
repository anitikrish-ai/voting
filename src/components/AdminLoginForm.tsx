"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEBUG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DEBUG_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: "zkrish6789@gmail.com",
        password,
      });

      if (authError) {
        setError("Error: " + authError.message);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Unexpected error: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {/* TEMPORARY DEBUG BLOCK — remove after we fix this */}
      <div style={{ border: "1px solid red", padding: "8px", fontSize: "11px", color: "#fff", background: "#300" }}>
        <div>URL present: {DEBUG_URL ? "YES" : "NO"}</div>
        <div>URL value: {DEBUG_URL ? DEBUG_URL.slice(0, 25) + "..." : "undefined"}</div>
        <div>KEY present: {DEBUG_KEY ? "YES" : "NO"}</div>
        <div>KEY value: {DEBUG_KEY ? DEBUG_KEY.slice(0, 15) + "..." : "undefined"}</div>
      </div>
      {/* END DEBUG BLOCK */}

      <div>
        <label htmlFor="admin-password" className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "var(--line-strong)", color: "var(--text)" }}
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full border px-4 py-3 text-sm uppercase tracking-[0.08em] disabled:opacity-50"
        style={{ borderColor: "var(--gold)", background: "var(--gold)", color: "var(--ink)", fontFamily: "var(--font-display)" }}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
