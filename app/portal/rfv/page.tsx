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

  // Busca todas as entradas paginando de 1000 em 1000 (limite do Supabase por request)
  async function fetchAllEntries() {
    const PAGE = 1000
    let allRows: any[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from("client_rfv_entries")
        .select("*")
        .eq("owner_id", user!.id)
        .order("purchase_date", { ascending: false })
        .range(from, from + PAGE - 1)
      if (error || !data || data.length === 0) break
      allRows = allRows.concat(data)
      if (data.length < PAGE) break
      from += PAGE
    }
    return allRows
  }

  const [entries, productsRes] = await Promise.all([
    fetchAllEntries(),
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
      entries={entries}
      products={productsRes.data ?? []}
    />
  )
}
