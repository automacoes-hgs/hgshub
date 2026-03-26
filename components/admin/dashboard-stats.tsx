import { Users, ShieldCheck, Activity, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  totalUsers: number
  totalAdmins: number
  isAdmin: boolean
}

const statCards = (totalUsers: number, totalAdmins: number) => [
  {
    title: "Total de Usuários",
    value: totalUsers,
    description: "Contas cadastradas",
    icon: Users,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    title: "Administradores",
    value: totalAdmins,
    description: "Usuários com acesso admin",
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Usuários Comuns",
    value: Math.max(totalUsers - totalAdmins, 0),
    description: "Acesso padrão",
    icon: Activity,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  {
    title: "Taxa de Admins",
    value: totalUsers > 0 ? `${Math.round((totalAdmins / totalUsers) * 100)}%` : "0%",
    description: "Proporção de administradores",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
]

export function DashboardStats({ totalUsers, totalAdmins, isAdmin }: DashboardStatsProps) {
  const cards = statCards(totalUsers, totalAdmins)
  const visibleCards = isAdmin ? cards : cards.slice(0, 1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {visibleCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
