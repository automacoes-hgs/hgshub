import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentUsers } from "@/components/admin/recent-users"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin")
    .eq("id", user!.id)
    .single()

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: totalAdmins } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", true)

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário"

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight text-balance">
          Olá, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está um resumo do sistema hoje.
        </p>
      </div>

      {/* Cards de métricas */}
      <DashboardStats
        totalUsers={totalUsers ?? 0}
        totalAdmins={totalAdmins ?? 0}
        isAdmin={profile?.is_admin ?? false}
      />

      {/* Usuários recentes (somente admin) */}
      {profile?.is_admin && recentUsers && (
        <RecentUsers users={recentUsers} />
      )}
    </div>
  )
}
