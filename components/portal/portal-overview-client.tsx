"use client"

import Link from "next/link"
import { useMemo } from "react"
import { TrendingUp, Users, Target, Clock, CheckCircle2, Lock, ArrowRight, DollarSign, Star, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { computePortalRfv, SEGMENT_CHART_COLORS, PORTAL_SEGMENT_ORDER, fmtValue, type PortalRfvEntry, type PortalRfvSegment } from "@/lib/rfv-portal"
import { cn } from "@/lib/utils"

interface Tool { tool: string; enabled: boolean }
interface Goal { id: string; title: string; target_value: number; current_value: number; unit: string; status: string }

interface Props {
  profile: { full_name?: string | null; company_name?: string | null; approved_at?: string | null } | null
  tools: Tool[]
  bdrCount: number
  activeGoals: Goal[]
  isPending: boolean
  rfvEntries: Pick<PortalRfvEntry, "customer_name" | "value" | "purchase_date" | "product_name">[]
  rfvEnabled: boolean
}

const TOOL_CARDS = [
  {
    key: "rfv_analysis",
    label: "Análise de RFV",
    description: "Segmente seus clientes por Recência, Frequência e Valor.",
    href: "/portal/rfv",
    icon: TrendingUp,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    key: "bdr_performance",
    label: "BDR Performance",
    description: "Acompanhe os lançamentos diários e metas da sua equipe de BDR.",
    href: "/portal/bdr",
    icon: Users,
    color: "text-chart-1",
    bg: "bg-chart-1/10",
  },
  {
    key: "goals_results",
    label: "Metas e Resultados",
    description: "Defina e acompanhe metas estratégicas da sua operação.",
    href: "/portal/goals",
    icon: Target,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
]

export function PortalOverviewClient({ profile, tools, bdrCount, activeGoals, isPending, rfvEntries, rfvEnabled }: Props) {
  const toolMap = Object.fromEntries(tools.map((t) => [t.tool, t.enabled]))
  const firstName = profile?.full_name?.split(" ")[0] ?? "usuário"

  // ── RFV mini-data ────────────────────────────────────────────────────────
  const rfvClients = useMemo(() => computePortalRfv(rfvEntries as PortalRfvEntry[]), [rfvEntries])
  const rfvTotalRevenue = useMemo(() => rfvEntries.reduce((s, e) => s + Number(e.value), 0), [rfvEntries])
  const rfvChampions = rfvClients.filter((c) => c.segment === "Campeões").length
  const rfvAtRisk = rfvClients.filter((c) => c.segment === "Em Risco" || c.segment === "Hibernando").length

  const segmentCounts = useMemo(() => {
    const map: Partial<Record<PortalRfvSegment, number>> = {}
    for (const c of rfvClients) map[c.segment] = (map[c.segment] ?? 0) + 1
    return PORTAL_SEGMENT_ORDER.filter((s) => map[s]).map((s) => ({
      name: s, value: map[s]!, color: SEGMENT_CHART_COLORS[s],
    }))
  }, [rfvClients])

  const revenueByProduct = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of rfvEntries) map[e.product_name] = (map[e.product_name] ?? 0) + Number(e.value)
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({
      name: name.length > 10 ? name.slice(0, 10) + "…" : name, value,
    }))
  }, [rfvEntries])

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Aguardando aprovação</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            Seu cadastro foi recebido com sucesso. Um administrador irá revisar e liberar
            o seu acesso em breve. Você receberá uma notificação assim que for aprovado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Olá, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.company_name ? `${profile.company_name} · ` : ""}Visão geral do seu painel
          </p>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          Acesso ativo
        </Badge>
      </div>

      {/* KPI rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Ferramentas ativas</p>
            <p className="text-3xl font-bold text-foreground">{tools.filter((t) => t.enabled).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">de {TOOL_CARDS.length} disponíveis</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">BDRs cadastrados</p>
            <p className="text-3xl font-bold text-foreground">{bdrCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">na sua equipe</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Metas ativas</p>
            <p className="text-3xl font-bold text-foreground">{activeGoals.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Ferramentas */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Suas ferramentas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOL_CARDS.map((card) => {
            const enabled = toolMap[card.key]
            return (
              <div key={card.key}>
                {enabled ? (
                  <Link href={card.href} className="block group">
                    <Card className="border-border hover:border-accent/50 hover:shadow-md transition-all h-full">
                      <CardContent className="pt-5 pb-5">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", card.bg)}>
                          <card.icon className={cn("h-5 w-5", card.color)} />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{card.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0 mt-0.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="border-border opacity-50 cursor-not-allowed h-full">
                    <CardContent className="pt-5 pb-5">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{card.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">Não liberado pelo administrador.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Metas recentes */}
      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Metas em andamento</h3>
            <Link href="/portal/goals" className="text-xs text-accent hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0
              const isOk = pct >= 80
              return (
                <Card key={goal.id} className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{goal.title}</p>
                      <span className={cn("text-xs font-bold", isOk ? "text-green-600" : "text-destructive")}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", isOk ? "bg-green-500" : "bg-destructive")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {goal.current_value} {goal.unit} de {goal.target_value} {goal.unit}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Mini-dashboard RFV ──────────────────────────────────────────────── */}
      {rfvEnabled && rfvEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Visão RFV</h3>
            <Link href="/portal/rfv" className="text-xs text-accent hover:underline flex items-center gap-1">
              Ver análise completa <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* KPIs RFV */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Receita Total", value: fmtValue(rfvTotalRevenue), icon: DollarSign, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Clientes Únicos", value: String(rfvClients.length), icon: Users, bg: "bg-slate-50", color: "text-slate-600" },
              { label: "Campeões", value: String(rfvChampions), icon: Star, bg: "bg-emerald-50", color: "text-emerald-600" },
              { label: "Em Risco", value: String(rfvAtRisk), icon: AlertTriangle, bg: "bg-red-50", color: "text-red-500" },
            ].map((k) => (
              <div key={k.label} className="bg-card border border-border rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{k.value}</p>
                </div>
                <div className={cn("p-1.5 rounded-lg shrink-0", k.bg)}>
                  <k.icon className={cn("h-4 w-4", k.color)} />
                </div>
              </div>
            ))}
          </div>

          {/* Gráficos RFV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donut por segmento */}
            <Card className="border-border">
              <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Distribuição por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 pb-4">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={segmentCounts} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                        {segmentCounts.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v} clientes`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1 min-w-0">
                    {segmentCounts.slice(0, 6).map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-[11px] text-muted-foreground truncate">{s.name}</span>
                        <span className="text-[11px] font-semibold text-foreground ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bar por produto */}
            <Card className="border-border">
              <CardHeader className="pb-0 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Receita por Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 pb-4">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={revenueByProduct} margin={{ bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tickFormatter={(v) => fmtValue(v)} tick={{ fontSize: 9 }} width={48} />
                    <Tooltip formatter={(v: number) => [fmtValue(v)]} />
                    <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CTA RFV quando habilitado mas sem dados */}
      {rfvEnabled && rfvEntries.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Análise de RFV ativa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Comece cadastrando as transações dos seus clientes para ver os gráficos aqui.</p>
          </div>
          <Link href="/portal/rfv">
            <Badge className="bg-accent/10 text-accent border-accent/20 gap-1 cursor-pointer hover:bg-accent/20 transition-colors">
              <TrendingUp className="h-3 w-3" /> Abrir RFV
            </Badge>
          </Link>
        </div>
      )}
    </div>
  )
}
