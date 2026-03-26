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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Cliente:</span>
        </div>
        <Select value={selectedClient} onValueChange={onClientChange}>
          <SelectTrigger className="h-8 w-auto min-w-[200px] text-sm border-border bg-background">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clientNames.sort((a, b) => a.localeCompare(b, "pt-BR")).map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClient !== "all" && (
          <button
            onClick={() => onClientChange("all")}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground divide-x divide-border">
        <span className="flex items-center gap-1.5 pr-4">
          <Users className="h-3.5 w-3.5" />
          <span><strong className="text-foreground font-semibold">{totalClients}</strong> clientes</span>
        </span>
        <span className="flex items-center gap-1.5 pl-4">
          <FileText className="h-3.5 w-3.5" />
          <span><strong className="text-foreground font-semibold">{totalContracts}</strong> contratos</span>
        </span>
      </div>
    </div>
  )
}
