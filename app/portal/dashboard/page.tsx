import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldOff } from "lucide-react"

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role, approved_at")
    .eq("id", user.id)
    .single()

  const isPending = !profile?.approved_at

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <ShieldOff className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {isPending ? "Aguardando aprovação" : `Olá, ${profile?.full_name ?? "usuário"}`}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isPending
            ? "Seu cadastro foi recebido. Um administrador irá revisar e liberar o seu acesso em breve."
            : "Seu painel de cliente está sendo preparado. As ferramentas serão exibidas aqui assim que forem liberadas pelo administrador."}
        </p>
      </div>
    </div>
  )
}
