"use client"

import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_ORDER, SEGMENT_COLORS } from "@/lib/rfv"
import { ClientCard } from "./client-card"

type Props = {
  clients: ClientRfv[]
  segmentFilter: RfvSegment | "Todos"
  onSegmentChange: (segment: RfvSegment | "Todos") => void
  search: string
  onSearchChange: (v: string) => void
  sortBy: "score" | "value" | "name" | "date"
  onSortChange: (v: "score" | "value" | "name" | "date") => void
  onClientClick: (client: ClientRfv) => void
}

export function ClientsGrid({
  clients,
  segmentFilter,
  onSegmentChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  onClientClick,
}: Props) {
  // Conta por segmento
  const countBySegment = SEGMENT_ORDER.reduce<Record<string, number>>((acc, seg) => {
    acc[seg] = clients.filter((c) => c.segment === seg).length
    return acc
  }, {})
  const totalCount = clients.length

  // Filtros
  const filtered = clients.filter((c) => {
    const matchSegment = segmentFilter === "Todos" || c.segment === segmentFilter
    const matchSearch = search === "" || c.clientName.toLowerCase().includes(search.toLowerCase())
    return matchSegment && matchSearch
  })

  // Ordenação
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "score": return b.score - a.score
      case "value": return b.totalValue - a.totalValue
      case "name": return a.clientName.localeCompare(b.clientName, "pt-BR")
      case "date": return b.lastPurchaseDate.localeCompare(a.lastPurchaseDate)
      default: return 0
    }
  })

  return (
    <div className="space-y-4">
      {/* Segment tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSegmentChange("Todos")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            segmentFilter === "Todos"
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border hover:border-foreground/30"
          }`}
        >
          Todos ({totalCount})
        </button>
        {SEGMENT_ORDER.filter((seg) => countBySegment[seg] > 0).map((seg) => {
          const colors = SEGMENT_COLORS[seg as RfvSegment]
          const isActive = segmentFilter === seg
          return (
            <button
              key={seg}
              onClick={() => onSegmentChange(seg as RfvSegment)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {seg} ({countBySegment[seg]})
            </button>
          )
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="score">Score RFV</option>
          <option value="value">Maior Valor</option>
          <option value="name">Nome A–Z</option>
          <option value="date">Mais Recente</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Exibindo {sorted.length} de {totalCount} clientes
      </p>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((client) => (
            <ClientCard
              key={client.clientName}
              client={client}
              onClick={() => onClientClick(client)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
