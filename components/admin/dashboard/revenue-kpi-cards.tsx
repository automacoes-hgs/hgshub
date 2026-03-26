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
  mrr,
  avgTicket,
  activeClients,
  totalClients,
  revenueAtRisk,
  atRiskCount,
}: RevenueKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {/* MRR Total */}
      <Card className="border border-blue-800/60 bg-blue-950/50">
        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
          <DollarSign className="h-4 w-4 text-blue-400 mb-1" />
          <p className="text-xs text-blue-400 font-medium">MRR total</p>
          <p className="text-xl font-bold text-blue-200">{fmt(mrr)}</p>
          <p className="text-xs text-blue-400">↑ 12% vs mês ant.</p>
        </CardContent>
      </Card>

      {/* Ticket médio */}
      <Card className="border border-emerald-800/60 bg-emerald-950/50">
        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
          <TrendingUp className="h-4 w-4 text-emerald-400 mb-1" />
          <p className="text-xs text-emerald-400 font-medium">Ticket médio</p>
          <p className="text-xl font-bold text-emerald-200">{fmt(avgTicket)}</p>
          <p className="text-xs text-emerald-400">por cliente</p>
        </CardContent>
      </Card>

      {/* Clientes ativos */}
      <Card className="border border-lime-800/60 bg-lime-950/50">
        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
          <Users className="h-4 w-4 text-lime-400 mb-1" />
          <p className="text-xs text-lime-400 font-medium">Clientes ativos</p>
          <p className="text-xl font-bold text-lime-200">{activeClients}</p>
          <p className="text-xs text-lime-400">de {totalClients} cadastrados</p>
        </CardContent>
      </Card>

      {/* Receita em risco */}
      <Card className="border border-amber-800/60 bg-amber-950/50">
        <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
          <AlertTriangle className="h-4 w-4 text-amber-400 mb-1" />
          <p className="text-xs text-amber-400 font-medium">Receita em risco</p>
          <p className="text-xl font-bold text-amber-200">{fmt(revenueAtRisk)}</p>
          <p className="text-xs text-amber-400">{atRiskCount} cliente{atRiskCount !== 1 ? "s" : ""} em risco</p>
        </CardContent>
      </Card>
    </div>
  )
}
