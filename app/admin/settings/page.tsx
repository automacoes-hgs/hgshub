import { createClient } from "@/lib/supabase/server"
import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_admin, created_at")
    .eq("id", user!.id)
    .single()

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Configurações
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informações da sua conta.
        </p>
      </div>

      <Card className="border-border bg-card max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-accent" />
            Dados da conta
          </CardTitle>
          <CardDescription>Informações do seu perfil no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nome
              </p>
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                E-mail
              </p>
              <p className="text-sm font-medium text-foreground">
                {profile?.email || user?.email || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tipo de acesso
              </p>
              <p className="text-sm font-medium text-foreground">
                {profile?.is_admin ? "Administrador" : "Usuário padrão"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Membro desde
              </p>
              <p className="text-sm font-medium text-foreground">{memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
