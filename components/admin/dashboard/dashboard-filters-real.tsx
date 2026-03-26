"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Users, FileText } from "lucide-react"

interface DashboardFiltersRealProps {
  clientNames: string[]
  selectedClient: string
  onClientChange: (val: string) => void
  totalContracts: number
  totalClients: number
}

export function DashboardFiltersReal({
  clientNames,
  selectedClient,
  onClientChange,
  totalContracts,
  totalClients,
}: DashboardFiltersRealProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtrar por cliente:</span>
        </div>
        <Select value={selectedClient} onValueChange={onClientChange}>
          <SelectTrigger className="h-8 w-auto min-w-[200px] text-sm border-border bg-muted/40">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {totalClients} clientes únicos
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {totalContracts} contratos
        </span>
      </div>
    </div>
  )
}
