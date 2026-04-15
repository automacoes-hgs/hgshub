"use client"

import { useState, useMemo } from "react"
import {
  TrendingUp, TrendingDown, Minus, Target, Building2,
  ChevronDown, ChevronUp, BarChart3, CheckCircle2, AlertCircle, Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"

// ── Tipos ──────────────────────────────────────────────────────────────────

type Goal = {
  id: string
  unidade: string | null
  tipo_receita: "MRR" | "MRU" | null
  ano: number
  mes: number | null
  categoria: string | null
  valor_meta: number
  resultado: number
  meta_clientes: number | null
  ticket_medio: number | null
  observacoes: string | null
}

type Company = {
  id: string
  name: string
  slug: string
  description: string | null
  company_goals: Goal[]
}

interface CompanyGoalsDashboardProps {
  companies: Company[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v)
}

function pct(meta: number, resultado: number) {
  if (meta === 0) return 0
  return Math.round((resultado / meta) * 100)
}

function periodLabel(g: Goal) {
  return g.mes ? `${MONTH_NAMES[g.mes - 1]}/${g.ano}` : String(g.ano)
}

function statusColor(p: number) {
  if (p >= 100) return "text-emerald-600"
  if (p >= 80)  return "text-amber-500"
  return "text-red-500"
}

function barColor(p: number) {
  if (p >= 100) return "#10B981"
  if (p >= 80)  return "#F59E0B"
  return "#EF4444"
}

// ── Tooltip customizado ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; payload: { meta: number; resultado: number; pct: number } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">Meta: <span className="text-foreground font-medium">{fmtBRL(d.meta)}</span></p>
      <p className="text-muted-foreground">Resultado: <span className="text-foreground font-medium">{fmtBRL(d.resultado)}</span></p>
      <p className={cn("font-bold", statusColor(d.pct))}>{d.pct}%</p>
    </div>
  )
}

// ── Sub-componente: card de empresa ───────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const [expanded, setExpanded] = useState(true)
  const goals = company.company_goals ?? []

  const totalMeta       = goals.reduce((s, g) => s + g.valor_meta, 0)
  const totalResultado  = goals.reduce((s, g) => s + g.resultado, 0)
  const overallPct      = pct(totalMeta, totalResultado)
  const atingidas       = goals.filter((g) => pct(g.valor_meta, g.resultado) >= 100).length
  const emRisco         = goals.filter((g) => pct(g.valor_meta, g.resultado) < 80).length

  // Dados para o gráfico — agrupa por período
  const chartData = useMemo(() => {
    return goals
      .slice()
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano
        return (a.mes ?? 0) - (b.mes ?? 0)
      })
      .map((g) => ({
        name: periodLabel(g),
        meta: g.valor_meta,
        resultado: g.resultado,
        pct: pct(g.valor_meta, g.resultado),
      }))
  }, [goals])

  return (
    <Card className="border-border bg-card shadow-sm">
      {/* Header da empresa */}
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground leading-tight">{company.name}</CardTitle>
              {company.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{company.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pb-4">
          {[
            {
              label: "Progresso Geral",
              value: `${overallPct}%`,
              icon: overallPct >= 100 ? TrendingUp : overallPct >= 80 ? Minus : TrendingDown,
              color: statusColor(overallPct),
            },
            {
              label: "Total Meta",
              value: fmtBRL(totalMeta),
              icon: Target,
              color: "text-foreground",
            },
            {
              label: "Total Resultado",
              value: fmtBRL(totalResultado),
              icon: BarChart3,
              color: "text-emerald-600",
            },
            {
              label: "Metas Atingidas",
              value: `${atingidas} / ${goals.length}`,
              icon: atingidas === goals.length && goals.length > 0 ? CheckCircle2 : emRisco > 0 ? AlertCircle : Clock,
              color: atingidas === goals.length && goals.length > 0 ? "text-emerald-600" : emRisco > 0 ? "text-red-500" : "text-amber-500",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
              <Icon className={cn("h-4 w-4 shrink-0", color)} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
                <p className={cn("text-sm font-bold mt-0.5 truncate", color)}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de progresso geral */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progresso acumulado</span>
            <span className={cn("text-xs font-bold", statusColor(overallPct))}>{overallPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500",
                overallPct >= 100 ? "bg-emerald-500" : overallPct >= 80 ? "bg-amber-400" : "bg-red-400"
              )}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {/* Conteúdo expansível */}
      {expanded && goals.length > 0 && (
        <CardContent className="pt-0 space-y-6">
          {/* Gráfico de barras */}
          {chartData.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Evolução por Período
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={52}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                    <Bar dataKey="meta" name="Meta" fill="var(--muted)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="resultado" name="Resultado" radius={[3, 3, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={barColor(entry.pct)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabela detalhada de metas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Detalhamento por Meta
            </p>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Período</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Categoria</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Meta</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Resultado</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals
                      .slice()
                      .sort((a, b) => {
                        if (a.ano !== b.ano) return b.ano - a.ano
                        return (b.mes ?? 0) - (a.mes ?? 0)
                      })
                      .map((g) => {
                        const p = pct(g.valor_meta, g.resultado)
                        const isOver = p >= 100
                        const isGood = p >= 80
                        return (
                          <tr key={g.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                              {periodLabel(g)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{g.categoria || "—"}</td>
                            <td className="px-4 py-3">
                              {g.tipo_receita ? (
                                <Badge variant="outline" className="text-xs">{g.tipo_receita}</Badge>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                              {fmtBRL(g.valor_meta)}
                            </td>
                            <td className={cn("px-4 py-3 text-right font-semibold", statusColor(p))}>
                              {fmtBRL(g.resultado)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                                <div className="flex items-center gap-1">
                                  {isOver ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : isGood ? (
                                    <Minus className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                  <span className={cn("text-xs font-bold", statusColor(p))}>{p}%</span>
                                </div>
                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full transition-all",
                                      isOver ? "bg-emerald-500" : isGood ? "bg-amber-400" : "bg-red-400"
                                    )}
                                    style={{ width: `${Math.min(p, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            {goals.some((g) => g.observacoes) && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</p>
                {goals.filter((g) => g.observacoes).map((g) => (
                  <div key={g.id} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    <span className="font-medium text-foreground shrink-0">{periodLabel(g)}:</span>
                    <span>{g.observacoes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}

      {expanded && goals.length === 0 && (
        <CardContent className="pt-2 pb-6 flex flex-col items-center gap-2 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada para esta empresa.</p>
        </CardContent>
      )}
    </Card>
  )
}

// ── Componente Principal ───────────────────────────────────────────────────

export function CompanyGoalsDashboard({ companies }: CompanyGoalsDashboardProps) {
  const allGoals = companies.flatMap((c) => c.company_goals ?? [])
  const totalMeta      = allGoals.reduce((s, g) => s + g.valor_meta, 0)
  const totalResultado = allGoals.reduce((s, g) => s + g.resultado, 0)
  const overallPct     = pct(totalMeta, totalResultado)
  const atingidas      = allGoals.filter((g) => pct(g.valor_meta, g.resultado) >= 100).length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">Dashboard de Metas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe o progresso das metas das empresas sob sua responsabilidade.
        </p>
      </div>

      {/* KPIs globais */}
      {companies.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Empresas",        value: String(companies.length),    icon: Building2,    color: "text-foreground" },
            { label: "Total de Metas",  value: String(allGoals.length),      icon: Target,      color: "text-foreground" },
            { label: "Meta Atingida",   value: `${atingidas}/${allGoals.length}`, icon: CheckCircle2, color: atingidas === allGoals.length && allGoals.length > 0 ? "text-emerald-600" : "text-amber-500" },
            { label: "Progresso Geral", value: `${overallPct}%`,            icon: BarChart3,   color: statusColor(overallPct) },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={cn("h-4.5 w-4.5", color)} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className={cn("text-lg font-bold leading-tight", color)}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cards por empresa */}
      <div className="space-y-5">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  )
}
