"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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