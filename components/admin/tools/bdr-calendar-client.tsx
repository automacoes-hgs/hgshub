"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Phone, CalendarCheck, CalendarClock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { BdrMember, BdrDailyLog, BdrGoal } from "@/lib/types/bdr"
import { MONTH_NAMES } from "@/lib/types/bdr"

interface BdrCalendarClientProps {
  members: BdrMember[]
  logs: BdrDailyLog[]
  goals: BdrGoal[]
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const CURRENT_YEAR = new Date().getFullYear()

export function BdrCalendarClient({ members, logs, goals }: BdrCalendarClientProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [selectedBdr, setSelectedBdr] = useState("all")

  function prev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  function next() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const activeGoal = useMemo(() => {
    if (selectedBdr === "all") return null
    return goals.find((g) => g.bdr_id === selectedBdr && g.month === month + 1 && g.year === year) ?? null
  }, [goals, selectedBdr, month, year])

  // Agrupar logs por dia
  const logsByDay = useMemo(() => {
    const map: Record<string, BdrDailyLog[]> = {}
    logs.forEach((l) => {
      const d = new Date(l.log_date + "T00:00:00")
      if (d.getFullYear() !== year || d.getMonth() !== month) return
      if (selectedBdr !== "all" && l.bdr_id !== selectedBdr) return
      const day = d.getDate()
      if (!map[day]) map[day] = []
      map[day].push(l)
    })
    return map
  }, [logs, year, month, selectedBdr])

  // Calcular o primeiro dia do mês e total de dias
  const firstDay = new Date(year, month, 1).getDay() // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Gerar células do calendário
  const cells: Array<{ day: number | null; logs: BdrDailyLog[] }> = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, logs: [] })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, logs: logsByDay[d] ?? [] })

  function cellColor(dayLogs: BdrDailyLog[]) {
    if (dayLogs.length === 0) return ""
    const sr = dayLogs.reduce((s, l) => s + l.meetings_scheduled, 0) > 0
      ? dayLogs.reduce((s, l) => s + l.meetings_done, 0) / dayLogs.reduce((s, l) => s + l.meetings_scheduled, 0) * 100
      : 0
    const metaSr = 80
    if (sr >= metaSr) return "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700"
    if (sr >= metaSr * 0.9) return "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700"
    return "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700"
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground min-w-36 text-center">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button onClick={next} className="p-1 rounded hover:bg-muted transition-colors">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <Select value={selectedBdr} onValueChange={setSelectedBdr}>
          <SelectTrigger className="h-8 w-44 text-sm border-border bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os BDRs</SelectItem>
            {members.filter((m) => m.is_active).map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Show Rate ≥ Meta</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Até 10% abaixo</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400" />Abaixo da meta</span>
      </div>

      {/* Grid */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell.day) {
              return <div key={`empty-${i}`} className="min-h-24 border-b border-r border-border last:border-r-0" />
            }
            const total = cell.logs.reduce((s, l) => ({
              attempts: s.attempts + l.attempts,
              scheduled: s.scheduled + l.meetings_scheduled,
              done: s.done + l.meetings_done,
            }), { attempts: 0, scheduled: 0, done: 0 })
            const sr = total.scheduled > 0 ? Math.round((total.done / total.scheduled) * 100) : null
            const color = cellColor(cell.logs)
            const isToday = cell.day === now.getDate() && month === now.getMonth() && year === now.getFullYear()

            return (
              <div
                key={cell.day}
                className={cn(
                  "min-h-24 p-2 border-b border-r border-border last:border-r-0 flex flex-col gap-1 transition-colors",
                  color || "bg-background hover:bg-muted/30",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <span className={cn(
                  "text-xs font-semibold",
                  isToday ? "text-blue-600" : cell.logs.length > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {cell.day}
                </span>
                {cell.logs.length > 0 && (
                  <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                    {total.attempts > 0 && (
                      <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{total.attempts}</span>
                    )}
                    {total.scheduled > 0 && (
                      <span className="flex items-center gap-1"><CalendarClock className="h-2.5 w-2.5" />{total.scheduled}</span>
                    )}
                    {total.done > 0 && (
                      <span className="flex items-center gap-1"><CalendarCheck className="h-2.5 w-2.5" />{total.done}</span>
                    )}
                    {sr !== null && (
                      <span className="font-semibold text-foreground">{sr}% SR</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
