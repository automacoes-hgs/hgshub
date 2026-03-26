import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShieldCheck, User, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/admin/dashboard")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Gerenciar Usuários
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lista completa de todos os usuários cadastrados no sistema.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Todos os usuários
              </CardTitle>
              <CardDescription>
                {users?.length ?? 0} usuário(s) no total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <User className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u, index) => {
                const initials = (u.full_name || u.email || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()

                const date = u.created_at
                  ? new Date(u.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-secondary-foreground">
                          {initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {u.full_name || "Sem nome"}
                          </p>
                          {index === 0 && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                              mais recente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="hidden md:block text-xs text-muted-foreground">
                        {date}
                      </span>
                      {u.is_admin ? (
                        <Badge className="text-xs bg-accent/10 text-accent border-accent/20 hover:bg-accent/10 gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <User className="h-3 w-3" />
                          Usuário
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
