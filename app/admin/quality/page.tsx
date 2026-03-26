import { createClient } from "@/lib/supabase/server"
import type { Contract } from "@/lib/types/contracts"
import { QualityPageClient } from "@/components/admin/quality/quality-page-client"

export default async function QualityPage() {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("purchase_date", { ascending: false })

  return <QualityPageClient contracts={(contracts as Contract[]) ?? []} />
}
