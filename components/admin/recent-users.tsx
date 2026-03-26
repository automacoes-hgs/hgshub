import { ShieldCheck, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  is_admin: boolean | null
  created_at: string | null
}

interface RecentUsersProps {
  users: UserRow[]
}

export function RecentUsers({ users }: RecentUsersProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Usuários recentes
        </CardTitle>
        <CardDescription>Últimos cadastros no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <User className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const initials = (user.full_name || user.email || "U")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()

              const date = user.created_at
                ? new Date(user.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-secondary-foreground">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.full_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="hidden sm:block text-xs text-muted-foreground">
                      {date}
                    </span>
                    {user.is_admin ? (
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
  )
}
