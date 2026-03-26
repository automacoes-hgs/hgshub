"use client"

import { Phone, Users, CalendarCheck, CalendarClock, Percent, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BdrSummary, BdrGoal } from "@/lib/types/bdr"

interface BdrKpiCardsProps {
  summary: BdrSummary
  goal: BdrGoal | null
}

function pct(actual: number, target: number) {
  if (target === 0) return null
  return Math.round((actual / target) * 100)
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pctVal = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = pctVal >= 80 ? "bg-emerald-500" : pctVal >= 50 ? "bg-amber-400" : "bg-red-500"
  return (
    <div className="h-1 w-full rounded-full bg-muted mt-2">
      <div className={cn("h-1 rounded-full transition-all", color)} style={{ width: `${pctVal}%` }} />
    </div>
  )
}

export function BdrKpiCards({ summary, goal }: BdrKpiCardsProps) {
  const cards = [
    {
      icon: Phone,
      label: "Tentativas",
      value: summary.attempts,
      goal: goal?.attempts_goal ?? 0,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      icon: Users,
      label: "Atendimentos",
      value: summary.attendances,
      goal: goal?.attendances_goal ?? 0,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      icon: CalendarClock,
      label: "Reuniões Agend.",
      value: summary.meetings_scheduled,
      goal: goal?.meetings_scheduled_goal ?? 0,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      icon: CalendarCheck,
      label: "Reuniões Realiz.",
      value: summary.meetings_done,
      goal: goal?.meetings_done_goal ?? 0,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      icon: Percent,
      label: "Show Rate",
      value: summary.show_rate,
      goal: goal?.lead_time_goal ? 80 : 80,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      icon: Clock,
      label: "Lead Time",
      value: summary.lead_time_avg,
      goal: goal?.lead_time_goal ?? 5,
      format: (v: number) => `${v.toFixed(1)} dias`,
      lowerIsBetter: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon
        const p = pct(c.value, c.goal)
        const pctVal = p !== null ? p : 0
        const good = c.lowerIsBetter
          ? c.value <= c.goal
          : pctVal >= 80
        const textColor = good ? "text-emerald-600" : pctVal >= 50 ? "text-amber-600" : "text-red-600"

        return (
          <Card key={c.label} className="border-border bg-card">
            <CardContent className="pt-4 pb-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {p !== null && (
                  <span className={cn("text-xs font-semibold", textColor)}>{p}%</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{c.label}</p>
              <p className="text-2xl font-bold text-foreground tracking-tight">{c.format(c.value)}</p>
              {c.goal > 0 && <ProgressBar value={c.value} max={c.goal} />}
              {c.goal > 0 && (
                <p className="text-[11px] text-muted-foreground">Meta: {c.format(c.goal)}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
