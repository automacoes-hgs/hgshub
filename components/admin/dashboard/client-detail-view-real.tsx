import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ClientHealth } from "@/lib/health"
import type { ClientRfv } from "@/lib/rfv"
import { SEGMENT_COLORS } from "@/lib/rfv"
import { getContractStatus, getDaysRemaining } from "@/lib/types/contracts"
import { cn } from "@/lib/utils"

interface ClientDetailViewRealProps {
  clientHealth: ClientHealth
  clientRfv: ClientRfv
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function scoreColor(score: number) {
  if (score >= 70) return "text-lime-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

export function ClientDetailViewReal({ clientHealth, clientRfv }: ClientDetailViewRealProps) {
  const segColors = SEGMENT_COLORS[clientHealth.rfvSegment]
  const activeContracts = clientHealth.contracts.filter((c) => getContractStatus(c) === "Ativo")
  const expiringContracts = activeContracts.filter((c) => getDaysRemaining(c) <= 30)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-700/60 bg-violet-950/40 px-5 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-violet-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {clientHealth.clientName[0]}
          </div>
          <div>
            <p className="font-semibold text-violet-100 text-base">{clientHealth.clientName}</p>
            <p className="text-xs text-violet-300">{clientHealth.plan}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium", segColors.bg, segColors.text, segColors.border)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", segColors.dot)} />
            {clientHealth.rfvSegment}
          </span>
          <span className="text-violet-200 font-semibold">{fmt(clientHealth.monthlyValue)}/mês</span>
          <span className={cn("font-semibold", scoreColor(clientHealth.healthScore))}>
            Health: {clientHealth.healthScore}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{clientHealth.activeContracts}</p>
            <p className="text-xs text-muted-foreground mt-1">Contratos ativos</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">{fmt(clientHealth.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Valor total</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {clientHealth.daysSinceLastPurchase === 0 ? "Hoje" : `${clientHealth.daysSinceLastPurchase}d`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Desde última compra</p>
          </CardContent>
        </Card>
        <Card className={cn("border-border bg-card", expiringContracts.length > 0 && "border-amber-700/60 bg-amber-950/30")}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={cn("text-2xl font-bold", expiringContracts.length > 0 ? "text-amber-300" : "text-foreground")}>
              {expiringContracts.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Vencendo em 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* RFV scores */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Scores RFV</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Recência", value: clientRfv.recency, desc: `${clientHealth.daysSinceLastPurchase} dias atrás` },
              { label: "Frequência", value: clientRfv.frequency, desc: `${clientRfv.contracts.length} contratos` },
              { label: "Monetário", value: clientRfv.monetary, desc: fmt(clientRfv.totalValue) },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center gap-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-3xl font-bold", s.value >= 4 ? "text-emerald-400" : s.value >= 3 ? "text-amber-400" : "text-red-400")}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={cn("h-1.5 w-5 rounded-full", i <= s.value ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contratos ativos */}
      {activeContracts.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Contratos ativos</p>
            <div className="flex flex-col gap-2">
              {activeContracts.map((c) => {
                const days = getDaysRemaining(c)
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                    <div>
                      <span className="font-medium text-foreground">{c.product || c.category}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.brand}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-mono">{fmt(c.value)}</span>
                      <Badge variant="outline" className={cn("text-xs", days <= 30 ? "border-amber-700 text-amber-400" : "border-border text-muted-foreground")}>
                        {days}d restantes
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
