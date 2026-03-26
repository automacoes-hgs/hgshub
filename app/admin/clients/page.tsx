import { createClient } from "@/lib/supabase/server"
import type { Contract } from "@/lib/types/contracts"
import { ClientsPageClient } from "@/components/admin/clients/clients-page-client"

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("purchase_date", { ascending: false })

  return <ClientsPageClient contracts={(contracts as Contract[]) ?? []} />
}
