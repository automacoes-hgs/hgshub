import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, AlertTriangle, DollarSign } from "lucide-react"

interface RevenueKpiCardsProps {
  mrr: number
  avgTicket: number
  activeClients: number
  totalClients: number
  revenueAtRisk: number
  atRiskCount: number
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export function RevenueKpiCards({
  mrr, avgTicket, activeClients, totalClients, revenueAtRisk, atRiskCount,
}: RevenueKpiCardsProps) {
  const cards = [
    {
      icon: DollarSign,
      label: "Receita Total",
      value: fmt(mrr),
      sub: "soma dos contratos ativos",
      accent: "text-blue-600",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      icon: TrendingUp,
      label: "Ticket Médio",
      value: fmt(avgTicket),
      sub: "por cliente ativo",
      accent: "text-emerald-600",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      icon: Users,
      label: "Clientes Ativos",
      value: String(activeClients),
      sub: `de ${totalClients} cadastrados`,
      accent: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      icon: AlertTriangle,
      label: "Receita em Risco",
      value: fmt(revenueAtRisk),
      sub: `${atRiskCount} cliente${atRiskCount !== 1 ? "s" : ""} em risco`,
      accent: "text-amber-600",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.label} className="border-border bg-card">
            <CardContent className="pt-5 pb-5 flex flex-col gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                <Icon className={`h-4 w-4 ${c.accent}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                <p className={`text-2xl font-bold tracking-tight mt-0.5 ${c.accent}`}>{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
