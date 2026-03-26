"use client"

import Link from "next/link"
import { TrendingUp, Users, Target, Clock, CheckCircle2, AlertCircle, Lock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Tool { tool: string; enabled: boolean }
interface Goal { id: string; title: string; target_value: number; current_value: number; unit: string; status: string }

interface Props {
  profile: { full_name?: string | null; company_name?: string | null; approved_at?: string | null } | null
  tools: Tool[]
  bdrCount: number
  activeGoals: Goal[]
  isPending: boolean
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

export function PortalOverviewClient({ profile, tools, bdrCount, activeGoals, isPending }: Props) {
  const toolMap = Object.fromEntries(tools.map((t) => [t.tool, t.enabled]))
  const firstName = profile?.full_name?.split(" ")[0] ?? "usuário"

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
    </div>
  )
}
