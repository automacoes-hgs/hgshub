import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortalGoalsClient } from "@/components/portal/portal-goals-client"

export default async function PortalGoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tool } = await supabase
    .from("user_tools")
    .select("enabled")
    .eq("user_id", user!.id)
    .eq("tool", "goals_results")
    .single()

  if (!tool?.enabled) redirect("/portal/dashboard")

  const { data: goals } = await supabase
    .from("client_goals")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })

  return <PortalGoalsClient goals={goals ?? []} ownerId={user!.id} />
}
