import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortalBdrClient } from "@/components/portal/portal-bdr-client"

export default async function PortalBdrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tool } = await supabase
    .from("user_tools")
    .select("enabled")
    .eq("user_id", user!.id)
    .eq("tool", "bdr_performance")
    .single()

  if (!tool?.enabled) redirect("/portal/dashboard")

  const [membersRes, logsRes] = await Promise.all([
    supabase
      .from("bdr_members")
      .select("id, name, email, is_active")
      .eq("owner_id", user!.id)
      .eq("is_active", true),
    supabase
      .from("bdr_daily_logs")
      .select("*")
      .eq("owner_id", user!.id)
      .order("log_date", { ascending: false })
      .limit(60),
  ])

  return (
    <PortalBdrClient
      ownerId={user!.id}
      members={membersRes.data ?? []}
      logs={logsRes.data ?? []}
    />
  )
}
