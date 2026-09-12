import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminPanelClient } from "@/components/AdminPanelClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Defense in depth: middleware only confirms a session exists; this
  // confirms the signed-in user is actually in the admins table, matching
  // the same is_admin() check RLS enforces on the tournament/players tables.
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    redirect("/admin/login");
  }

  const [{ data: players }, { data: tournament }] = await Promise.all([
    supabase.from("players").select("*").order("votes_count", { ascending: false }),
    supabase.from("tournament").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
      <AdminPanelClient initialPlayers={players ?? []} initialStatus={tournament?.status ?? "closed"} />
    </main>
  );
}
