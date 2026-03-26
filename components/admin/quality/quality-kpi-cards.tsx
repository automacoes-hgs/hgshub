"use client"

import { ShieldCheck, AlertTriangle, XCircle, Activity } from "lucide-react"
import type { ClientHealth } from "@/lib/health"

type Props = {
  clients: ClientHealth[]
}

export function QualityKpiCards({ clients }: Props) {
  const total = clients.length
  const healthy   = clients.filter((c) => c.status === "Saudável").length
  const attention = clients.filter((c) => c.status === "Atenção").length
  const risk      = clients.filter((c) => c.status === "Em Risco").length

  // Engajamento: clientes com lastPurchaseDate nos últimos 7 dias
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const engaged = clients.filter(
    (c) => new Date(c.lastPurchaseDate).getTime() >= sevenDaysAgo
  ).length
  const engagementPct = total ? Math.round((engaged / total) * 100) : 0

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const cards = [
    {
      label: "Clientes Saudáveis",
      value: healthy,
      sub: `${pct(healthy)}% do total`,
      icon: ShieldCheck,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      border: "border-l-emerald-500",
    },
    {
      label: "Em Atenção",
      value: attention,
      sub: `${pct(attention)}% do total`,
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      border: "border-l-amber-500",
    },
    {
      label: "Em Risco",
      value: risk,
      sub: `${pct(risk)}% do total`,
      icon: XCircle,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
      border: "border-l-red-500",
    },
    {
      label: "Engajamento (7 dias)",
      value: `${engagementPct}%`,
      sub: `${engaged} de ${total} clientes ativos`,
      icon: Activity,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      border: "border-l-blue-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`bg-card rounded-xl border border-border border-l-4 ${card.border} p-5 flex items-center gap-4`}
          >
            <div className={`flex-shrink-0 p-3 rounded-xl ${card.iconBg}`}>
              <Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground leading-tight truncate">{card.label}</p>
              <p className="text-2xl font-bold text-foreground leading-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
