"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "var(--line-strong)", color: "var(--text)" }}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--text-faint)" }}>
          Password
        </label>
        <input
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
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
