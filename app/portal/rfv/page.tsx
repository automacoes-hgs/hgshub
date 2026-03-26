import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortalRfvClient } from "@/components/portal/portal-rfv-client"

export default async function PortalRfvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tool } = await supabase
    .from("user_tools")
    .select("enabled")
    .eq("user_id", user!.id)
    .eq("tool", "rfv_analysis")
    .single()

  if (!tool?.enabled) redirect("/portal/dashboard")

  const [entriesRes, productsRes] = await Promise.all([
    supabase
      .from("client_rfv_entries")
      .select("*")
      .eq("owner_id", user!.id)
      .order("purchase_date", { ascending: false }),
    supabase
      .from("client_products")
      .select("*")
      .eq("owner_id", user!.id)
      .eq("is_active", true)
      .order("name"),
  ])

  return (
    <PortalRfvClient
      ownerId={user!.id}
      entries={entriesRes.data ?? []}
      products={productsRes.data ?? []}
    />
  )
}
