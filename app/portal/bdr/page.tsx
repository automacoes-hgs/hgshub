import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3 } from "lucide-react"

export default async function PortalBdrPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "bdr_user") redirect("/portal/dashboard")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Olá, {profile?.full_name ?? "BDR"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Seu painel de BDR está sendo preparado. Em breve você poderá registrar seus lançamentos diários aqui.
        </p>
      </div>
    </div>
  )
}
