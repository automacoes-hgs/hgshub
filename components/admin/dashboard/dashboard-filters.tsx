"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter } from "lucide-react"
import type { Client } from "@/lib/mock-data"
import { MODULES, PERIODS } from "@/lib/mock-data"

interface DashboardFiltersProps {
  clients: Client[]
  selectedClient: string
  selectedModule: string
  selectedPeriod: string
  onClientChange: (val: string) => void
  onModuleChange: (val: string) => void
  onPeriodChange: (val: string) => void
}

export function DashboardFilters({
  clients,
  selectedClient,
  selectedModule,
  selectedPeriod,
  onClientChange,
  onModuleChange,
  onPeriodChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtros:</span>
      </div>

      {/* Cliente */}
      <Select value={selectedClient} onValueChange={onClientChange}>
        <SelectTrigger className="h-8 w-auto min-w-[180px] text-sm border-border bg-muted/40">
          <SelectValue placeholder="Todos os clientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os clientes</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Módulo */}
      <Select value={selectedModule} onValueChange={onModuleChange}>
        <SelectTrigger className="h-8 w-auto min-w-[180px] text-sm border-border bg-muted/40">
          <SelectValue placeholder="Todos os módulos" />
        </SelectTrigger>
        <SelectContent>
          {MODULES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Período */}
      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm border-border bg-muted/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
