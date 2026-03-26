import { createClient } from "@/lib/supabase/server"
import { PortalOverviewClient } from "@/components/portal/portal-overview-client"

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, toolsRes, bdrRes, goalsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, company_name, role, approved_at, email").eq("id", user!.id).single(),
    supabase.from("user_tools").select("tool, enabled").eq("user_id", user!.id),
    supabase.from("bdr_members").select("id, name, is_active").eq("owner_id", user!.id),
    supabase.from("client_goals").select("id, title, target_value, current_value, unit, status").eq("owner_id", user!.id).eq("status", "active").limit(3),
  ])

  return (
    <PortalOverviewClient
      profile={profileRes.data}
      tools={toolsRes.data ?? []}
      bdrCount={bdrRes.data?.length ?? 0}
      activeGoals={goalsRes.data ?? []}
      isPending={!profileRes.data?.approved_at}
    />
  )
}
