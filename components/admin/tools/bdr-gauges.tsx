"use client"

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import type { BdrSummary, BdrGoal } from "@/lib/types/bdr"

interface GaugeProps {
  label: string
  actual: number
  goal: number
  format?: (v: number) => string
}

function Gauge({ label, actual, goal, format = (v) => String(v) }: GaugeProps) {
  const pct = goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444"

  const data = [{ value: pct, fill: color }]

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-4 pb-4 flex flex-col items-center gap-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">{label}</p>
        <div className="relative w-32 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="85%"
              innerRadius="60%" outerRadius="100%"
              startAngle={180} endAngle={0}
              data={data}
              barSize={12}
            >
              <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={6} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-2xl font-bold leading-none" style={{ color }}>{pct}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">{format(actual)}</p>
        <p className="text-xs text-muted-foreground">de {format(goal)}</p>
      </CardContent>
    </Card>
  )
}

interface BdrGaugesProps {
  summary: BdrSummary
  goal: BdrGoal | null
}

export function BdrGauges({ summary, goal }: BdrGaugesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Gauge
        label="Meta Tentativas"
        actual={summary.attempts}
        goal={goal?.attempts_goal ?? 0}
      />
      <Gauge
        label="Meta Reuniões Agend."
        actual={summary.meetings_scheduled}
        goal={goal?.meetings_scheduled_goal ?? 0}
      />
      <Gauge
        label="Meta Reuniões Realiz."
        actual={summary.meetings_done}
        goal={goal?.meetings_done_goal ?? 0}
      />
    </div>
  )
}
