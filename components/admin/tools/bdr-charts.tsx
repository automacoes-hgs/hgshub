"use client"

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BdrDailyLog, BdrGoal } from "@/lib/types/bdr"

interface BdrChartsProps {
  logs: BdrDailyLog[]
  goal: BdrGoal | null
}

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function BdrCharts({ logs, goal }: BdrChartsProps) {
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date))

  const evolutionData = sorted.map((l) => ({
    date: fmt(l.log_date),
    tentativas: l.attempts,
    agendadas: l.meetings_scheduled,
    realizadas: l.meetings_done,
  }))

  const showRateData = sorted.map((l) => ({
    date: fmt(l.log_date),
    showRate: l.meetings_scheduled > 0
      ? Math.round((l.meetings_done / l.meetings_scheduled) * 100)
      : 0,
  }))

  const leadTimeData = sorted.map((l) => ({
    date: fmt(l.log_date),
    leadTime: Number(l.lead_time_days),
  }))

  const tooltipStyle = {
    contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 },
    labelStyle: { color: "var(--foreground)" },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Evolução Diária */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Evolução Diária</CardTitle>
        </CardHeader>
        <CardContent>
          {evolutionData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="tentativas" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Tentativas" />
                <Line type="monotone" dataKey="agendadas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Reuniões Agend." />
                <Line type="monotone" dataKey="realizadas" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Reuniões Realiz." />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Funil de Conversão */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período</p>
          ) : (
            <FunnelChart logs={logs} />
          )}
        </CardContent>
      </Card>

      {/* Show Rate */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Show Rate ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          {showRateData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={showRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Show Rate"]} />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Meta: 80%", fill: "#ef4444", fontSize: 10 }} />
                <Line type="monotone" dataKey="showRate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Lead Time */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Lead Time Médio por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {leadTimeData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}d`} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} dias`, "Lead Time"]} />
                <ReferenceLine y={goal?.lead_time_goal ?? 5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Meta: ${goal?.lead_time_goal ?? 5}d`, fill: "#ef4444", fontSize: 10 }} />
                <Bar dataKey="leadTime" radius={[4, 4, 0, 0]}>
                  {leadTimeData.map((d, i) => (
                    <Cell key={i} fill={d.leadTime <= (goal?.lead_time_goal ?? 5) ? "#6366f1" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FunnelChart({ logs }: { logs: BdrDailyLog[] }) {
  const totals = {
    Tentativas:    logs.reduce((s, l) => s + l.attempts, 0),
    Atendimentos:  logs.reduce((s, l) => s + l.attendances, 0),
    Qualificações: logs.reduce((s, l) => s + l.qualifications, 0),
    "Reuniões Agend.": logs.reduce((s, l) => s + l.meetings_scheduled, 0),
    "Reuniões Realiz.": logs.reduce((s, l) => s + l.meetings_done, 0),
  }
  const max = totals.Tentativas || 1
  const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]

  return (
    <div className="flex flex-col gap-2 pt-1">
      {Object.entries(totals).map(([label, val], i) => {
        const prev = i === 0 ? max : Object.values(totals)[i - 1]
        const conv = i === 0 ? null : prev > 0 ? Math.round((val / prev) * 100) : 0
        const width = Math.round((val / max) * 100)
        return (
          <div key={label} className="flex items-center gap-3 text-xs">
            <span className="w-32 text-right text-muted-foreground shrink-0">{label}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                <div className="h-full rounded-sm transition-all" style={{ width: `${width}%`, backgroundColor: COLORS[i] }} />
              </div>
              <span className="font-semibold text-foreground w-8 text-right">{val}</span>
            </div>
            {conv !== null && (
              <span className="text-muted-foreground w-16">{conv}% conv.</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
