import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TrendingUp, Lock } from "lucide-react"

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Análise de RFV</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recência, Frequência e Valor — segmente seus clientes de forma inteligente.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-xl border border-border bg-card text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Análise de RFV</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Esta ferramenta está disponível e em desenvolvimento. Em breve você poderá segmentar sua base de clientes por Recência, Frequência e Valor.
          </p>
        </div>
      </div>
    </div>
  )
}
