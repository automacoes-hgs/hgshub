import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompanyGoalsDashboard } from "@/components/portal/company-goals-dashboard"
import { getMyCompanyGoals } from "@/app/admin/companies/actions"

export const metadata = {
  title: "Metas da Empresa | HGS Hub",
  description: "Acompanhe o progresso das metas da sua empresa em tempo real.",
}

export default async function CompanyGoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Bloqueia admins — eles gerenciam pelo painel admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()

  if (profile?.is_admin || profile?.role === "admin") {
    redirect("/admin/companies")
  }

  const { data, error } = await getMyCompanyGoals()

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Erro ao carregar dados: {error}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <svg className="h-7 w-7 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Nenhuma empresa vinculada</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Você ainda não foi vinculado como responsável de nenhuma empresa. Contate o administrador.
          </p>
        </div>
      </div>
    )
  }

  // Normaliza o shape retornado pelo Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companies = data.map((row: any) => row.companies).filter(Boolean)

  return <CompanyGoalsDashboard companies={companies} />
}
