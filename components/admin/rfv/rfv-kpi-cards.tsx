"use client"

import { Users, DollarSign, TrendingUp, Target, UserCheck, AlertTriangle, Star } from "lucide-react"
import type { ClientRfv } from "@/lib/rfv"
import { getContractStatus, CATEGORIES } from "@/lib/types/contracts"

type Props = {
  clients: ClientRfv[]
}

function fmt(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
}

export function RfvKpiCards({ clients }: Props) {
  const totalContracts = clients.reduce((s, c) => s + c.contracts.length, 0)
  const totalValue = clients.reduce((s, c) => s + c.totalValue, 0)
  const avgTicket = clients.length ? totalValue / clients.length : 0

  // Janela de recompra: clientes com contrato expirando em até 30 dias
  const now = new Date()
  const renewalWindow = clients.filter((c) =>
    c.contracts.some((ct) => {
      const status = getContractStatus(ct)
      if (status !== "Ativo") return false
      const end = ct.custom_end_date ? new Date(ct.custom_end_date) : (() => {
        const cat = CATEGORIES.find((x) => x.name === ct.category)
        const d = new Date(ct.purchase_date)
        d.setDate(d.getDate() + (cat?.cycleDays ?? 365))
        return d
      })()
      const days = Math.round((end.getTime() - now.getTime()) / 86400000)
      return days >= 0 && days <= 30
    })
  ).length

  const activeClients = clients.filter((c) =>
    c.contracts.some((ct) => getContractStatus(ct) === "Ativo")
  ).length
  const activePct = clients.length ? Math.round((activeClients / clients.length) * 100) : 0

  const atRiskOrHibernating = clients.filter(
    (c) => c.segment === "Em Risco" || c.segment === "Hibernando"
  ).length
  const atRiskPct = clients.length ? Math.round((atRiskOrHibernating / clients.length) * 100) : 0

  const upsellEligible = clients.filter(
    (c) => c.segment === "Campeões" || c.segment === "Fiéis" || c.segment === "Promissores"
  ).length

  const champions = clients.filter((c) => c.segment === "Campeões").length

  const cards = [
    {
      label: "Receita Total",
      value: fmt(totalValue),
      sub: `${totalContracts} contratos`,
      icon: DollarSign,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total de Clientes",
      value: String(clients.length),
      sub: `${totalContracts} contratos`,
      icon: Users,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
    {
      label: "Ticket Médio",
      value: fmt(avgTicket),
      sub: "por cliente",
      icon: TrendingUp,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
    {
      label: "Janela de Recompra",
      value: String(renewalWindow),
      sub: "Clientes prontos para renovar",
      icon: Target,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      highlight: renewalWindow > 0,
    },
    {
      label: "Clientes Ativos",
      value: `${activePct}%`,
      sub: `${activeClients} clientes`,
      icon: UserCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Em Risco / Hibernando",
      value: `${atRiskPct}%`,
      sub: `${atRiskOrHibernating} clientes`,
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
    {
      label: "Potencial Upsell",
      value: String(upsellEligible),
      sub: "Clientes elegíveis",
      icon: TrendingUp,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Campeões",
      value: String(champions),
      sub: "Clientes top",
      icon: Star,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`bg-card border rounded-xl p-4 flex items-start justify-between gap-3 ${card.highlight ? "border-amber-300 bg-amber-50/40" : "border-border"}`}
          >
            <div>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
            <div className={`${card.iconBg} p-2 rounded-lg shrink-0`}>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
