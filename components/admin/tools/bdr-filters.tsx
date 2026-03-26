"use client"

import { Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BdrMember } from "@/lib/types/bdr"
import { MONTH_NAMES } from "@/lib/types/bdr"

interface BdrFiltersProps {
  members: BdrMember[]
  selectedBdr: string
  selectedMonth: number
  selectedYear: number
  onBdrChange: (v: string) => void
  onMonthChange: (v: number) => void
  onYearChange: (v: number) => void
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export function BdrFilters({
  members, selectedBdr, selectedMonth, selectedYear,
  onBdrChange, onMonthChange, onYearChange,
}: BdrFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span>Filtros:</span>
      </div>

      <Select value={String(selectedMonth)} onValueChange={(v) => onMonthChange(Number(v))}>
        <SelectTrigger className="h-8 w-36 text-sm border-border bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(selectedYear)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="h-8 w-24 text-sm border-border bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedBdr} onValueChange={onBdrChange}>
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
  )
}
