import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Users, Package } from "lucide-react"
import type { Client } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ClientDetailViewProps {
  client: Client
  module: string
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function scoreColor(score: number) {
  if (score >= 70) return "text-lime-400"
  if (score >= 40) return "text-amber-400"
  return "text-red-400"
}

function planColor(plan: string) {
  const map: Record<string, string> = {
    Enterprise: "bg-blue-900/50 text-blue-200 border-blue-700",
    Professional: "bg-violet-900/50 text-violet-200 border-violet-700",
    Starter: "bg-emerald-900/50 text-emerald-200 border-emerald-700",
    Free: "bg-zinc-800/50 text-zinc-300 border-zinc-600",
  }
  return map[plan] ?? "bg-muted text-muted-foreground border-border"
}

export function ClientDetailView({ client, module }: ClientDetailViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header do cliente */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-violet-700/60 bg-violet-950/40 px-5 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-violet-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {client.name[0]}
          </div>
          <div>
            <p className="font-semibold text-violet-100 text-base">{client.name}</p>
            <p className="text-xs text-violet-300">{client.modules.length} módulo{client.modules.length !== 1 ? "s" : ""} ativo{client.modules.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Badge className={cn("border text-xs font-medium", planColor(client.plan))}>
            {client.plan}
          </Badge>
          <span className="text-violet-200 font-semibold">{fmt(client.monthlyValue)}/mês</span>
          <span className={cn("font-semibold", scoreColor(client.healthScore))}>
            Score: {client.healthScore}
          </span>
        </div>
      </div>

      {/* Conteúdo condicional por módulo */}
      {module === "bdr" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Leads prospectados", value: "142", icon: Users },
            { label: "Reuniões agendadas", value: "38", icon: TrendingUp },
            { label: "Show rate", value: "74%", icon: Activity },
            { label: "Conversões", value: "12", icon: Package },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label} className="border-border bg-card">
                <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
                  <Icon className="h-4 w-4 text-blue-400 mb-1" />
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {module === "metas" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Meta de vendas", meta: "R$ 50.000", resultado: "R$ 43.200", pct: 86 },
            { label: "Meta de novos clientes", meta: "20", resultado: "17", pct: 85 },
            { label: "Meta de retenção", meta: "95%", resultado: "91%", pct: 96 },
          ].map((m) => (
            <Card key={m.label} className="border-border bg-card">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">{m.label}</p>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-lg font-bold text-foreground">{m.resultado}</span>
                  <span className="text-xs text-muted-foreground">meta: {m.meta}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", m.pct >= 90 ? "bg-lime-500" : m.pct >= 70 ? "bg-amber-400" : "bg-red-500")}
                    style={{ width: `${Math.min(m.pct, 100)}%` }}
                  />
                </div>
                <p className={cn("text-xs mt-1 font-medium", m.pct >= 90 ? "text-lime-400" : m.pct >= 70 ? "text-amber-400" : "text-red-400")}>
                  {m.pct}% atingido
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {module === "rfv" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Campeões", value: "34", color: "text-lime-400" },
            { label: "Leais", value: "58", color: "text-blue-400" },
            { label: "Em risco", value: "22", color: "text-amber-400" },
            { label: "Inativos", value: "11", color: "text-red-400" },
          ].map((seg) => (
            <Card key={seg.label} className="border-border bg-card">
              <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
                <p className={cn("text-2xl font-bold", seg.color)}>{seg.value}</p>
                <p className="text-xs text-muted-foreground">{seg.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {module === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Módulos ativos</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {client.modules.length > 0
                  ? client.modules.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                    ))
                  : <span className="text-xs text-muted-foreground">Nenhum módulo contratado</span>
                }
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Contrato</p>
              <p className="text-lg font-bold text-foreground">
                {client.contractDaysLeft !== null ? `${client.contractDaysLeft} dias restantes` : "Sem contrato ativo"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Último acesso</p>
              <p className="text-lg font-bold text-foreground">
                {client.lastAccess === "never" ? "Nunca acessou" : (() => {
                  const days = Math.round((Date.now() - new Date(client.lastAccess).getTime()) / (1000 * 60 * 60 * 24))
                  return days === 0 ? "Hoje" : `Há ${days} dias`
                })()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
