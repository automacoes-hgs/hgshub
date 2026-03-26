import { createClient } from "@/lib/supabase/server"
import type { Contract } from "@/lib/types/contracts"
import { RfvPageClient } from "@/components/admin/rfv/rfv-page-client"

export default async function RfvPage() {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("purchase_date", { ascending: false })

  const rows = (contracts as Contract[]) ?? []

  return <RfvPageClient contracts={rows} totalContracts={rows.length} />
}
