import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompaniesClient } from "@/components/admin/companies/companies-client"

export const metadata = {
  title: "Empresas | HGS Hub",
  description: "Gerenciar empresas e suas metas",
}

export default async function CompaniesPage() {
  const supabase = await createClient()

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/portal")
  }

  // Buscar empresas e suas metas
  const { data: companies } = await supabase
    .from("companies")
    .select(`
      *,
      goals:company_goals(*)
    `)
    .order("created_at", { ascending: false })

  return <CompaniesClient initialCompanies={companies ?? []} />
}
