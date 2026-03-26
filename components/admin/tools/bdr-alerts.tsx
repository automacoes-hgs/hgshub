"use client"

import { AlertTriangle, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { BdrSummary, BdrGoal } from "@/lib/types/bdr"

interface BdrAlertsProps {
  summary: BdrSummary
  goal: BdrGoal | null
}

interface Alert {
  type: "danger" | "warning"
  message: string
}

export function BdrAlerts({ summary, goal }: BdrAlertsProps) {
  if (!goal) return null

  const alerts: Alert[] = []
  const THRESHOLD = 0.8

  function checkGoal(actual: number, target: number, label: string) {
    if (target === 0) return
    const pct = actual / target
    if (pct < THRESHOLD) {
      alerts.push({
        type: pct < 0.5 ? "danger" : "warning",
        message: `${label}: ${Math.round(pct * 100)}% da meta (abaixo de 80%)`,
      })
    }
  }

  checkGoal(summary.attempts, goal.attempts_goal, "Tentativas")
  checkGoal(summary.attendances, goal.attendances_goal, "Atendimentos")
  checkGoal(summary.meetings_scheduled, goal.meetings_scheduled_goal, "Reuniões Agendadas")
  checkGoal(summary.meetings_done, goal.meetings_done_goal, "Reuniões Realizadas")

  if (summary.show_rate < 80) {
    alerts.push({
      type: "warning",
      message: `Show Rate ${summary.show_rate.toFixed(1)}% abaixo da meta de 80%`,
    })
  }

  if (alerts.length === 0) return null

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Alertas — {alerts.length} indicador{alerts.length !== 1 ? "es" : ""} abaixo da meta
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
              a.type === "danger"
                ? "border-l-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                : "border-l-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
            )}
          >
            <TrendingDown className="h-3.5 w-3.5 shrink-0" />
            {a.message}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
