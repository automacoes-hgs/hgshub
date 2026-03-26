"use client"

import { useState, useMemo } from "react"
import { BdrFilters } from "./bdr-filters"
import { BdrAlerts } from "./bdr-alerts"
import { BdrKpiCards } from "./bdr-kpi-cards"
import { BdrGauges } from "./bdr-gauges"
import { BdrCharts } from "./bdr-charts"
import type { BdrMember, BdrGoal, BdrDailyLog } from "@/lib/types/bdr"
import { sumLogs } from "@/lib/types/bdr"

interface BdrOverviewClientProps {
  members: BdrMember[]
  goals: BdrGoal[]
  logs: BdrDailyLog[]
}

export function BdrOverviewClient({ members, goals, logs }: BdrOverviewClientProps) {
  const now = new Date()
  const [selectedBdr, setSelectedBdr] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const d = new Date(l.log_date + "T00:00:00")
      const matchMonth = d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
      const matchBdr = selectedBdr === "all" || l.bdr_id === selectedBdr
      return matchMonth && matchBdr
    })
  }, [logs, selectedBdr, selectedMonth, selectedYear])

  const activeGoal = useMemo(() => {
    if (selectedBdr === "all") return null
    return goals.find((g) => g.bdr_id === selectedBdr && g.month === selectedMonth && g.year === selectedYear) ?? null
  }, [goals, selectedBdr, selectedMonth, selectedYear])

  const summary = useMemo(() => sumLogs(filteredLogs), [filteredLogs])

  return (
    <div className="flex flex-col gap-5">
      <BdrFilters
        members={members}
        selectedBdr={selectedBdr}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onBdrChange={setSelectedBdr}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />
      <BdrAlerts summary={summary} goal={activeGoal} />
      <BdrKpiCards summary={summary} goal={activeGoal} />
      <BdrGauges summary={summary} goal={activeGoal} />
      <BdrCharts logs={filteredLogs} goal={activeGoal} />
    </div>
  )
}
