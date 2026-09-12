import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--gold)", fontFamily: "var(--font-display)" }}>
          Tournament Control
        </p>
        <h1 className="mt-2 mb-8 text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
          Admin Sign In
        </h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}
