"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import type { Contract } from "@/lib/types/contracts"
import type { RfvSegment, ClientRfv } from "@/lib/rfv"
import { computeClientsRfv } from "@/lib/rfv"
import { RfvKpiCards } from "./rfv-kpi-cards"
import { RfvSegmentCards } from "./rfv-segment-cards"
import { RfvCharts } from "./rfv-charts"
import { RfvMatrix } from "./rfv-matrix"
import { RfvTable } from "./rfv-table"
import { RfvConfig } from "./rfv-config"

type Props = {
  contracts: Contract[]
  totalContracts: number
}

export function RfvPageClient({ contracts, totalContracts }: Props) {
  const [activeSegment, setActiveSegment] = useState<RfvSegment | "Todos">("Todos")
  const [search, setSearch] = useState("")

  const allClients = useMemo(() => computeClientsRfv(contracts), [contracts])

  const filteredClients = useMemo(() => {
    let result = allClients
    if (activeSegment !== "Todos") {
      result = result.filter((c) => c.segment === activeSegment)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.clientName.toLowerCase().includes(q))
    }
    return result
  }, [allClients, activeSegment, search])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard RFV</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise estratégica da carteira de clientes</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
          <span className="font-medium text-foreground">{allClients.length}</span> clientes
          &bull;
          <span className="font-medium text-foreground">{totalContracts}</span> contratos
        </div>
      </div>

      {/* KPI Cards 2x4 */}
      <RfvKpiCards clients={allClients} />

      {/* Segment filter cards */}
      <RfvSegmentCards
        clients={allClients}
        activeSegment={activeSegment}
        onSegmentClick={setActiveSegment}
      />

      {/* Charts */}
      <RfvCharts clients={allClients} />

      {/* Matriz RFV */}
      <RfvMatrix clients={allClients} />

      {/* Config accordion */}
      <RfvConfig />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Detailed table */}
      <RfvTable clients={filteredClients} />
    </div>
  )
}
