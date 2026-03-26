import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Contract } from "@/lib/types/contracts"
import { ClientsPageClient } from "@/components/admin/clients/clients-page-client"

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) redirect("/admin/dashboard")

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .order("purchase_date", { ascending: false })

  return <ClientsPageClient contracts={(contracts as Contract[]) ?? []} />
}
