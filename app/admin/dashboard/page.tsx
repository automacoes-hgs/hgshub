import { createClient } from "@/lib/supabase/server"
import type { Contract } from "@/lib/types/contracts"
import { computeClientsRfv } from "@/lib/rfv"
import { computeClientsHealth } from "@/lib/health"
import { DashboardClient } from "@/components/admin/dashboard/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("purchase_date", { ascending: false })

  const allContracts: Contract[] = (contracts as Contract[]) ?? []
  const clientsRfv = computeClientsRfv(allContracts)
  const clientsHealth = computeClientsHealth(clientsRfv, allContracts)

  return (
    <DashboardClient
      contracts={allContracts}
      clientsRfv={clientsRfv}
      clientsHealth={clientsHealth}
    />
  )
}
