"use client"

import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_ORDER, SEGMENT_COLORS } from "@/lib/rfv"

type Props = {
  clients: ClientRfv[]
  activeSegment: RfvSegment | "Todos"
  onSegmentClick: (seg: RfvSegment | "Todos") => void
}

function fmt(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)} mi`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)} mil`
  return `R$ ${v.toLocaleString("pt-BR")}`
}

// Hex colors for each segment (for inline border-left style)
const SEGMENT_HEX: Record<RfvSegment, string> = {
  "Campeões":              "#10b981",
  "Fiéis":                 "#0ea5e9",
  "Promissores":           "#f59e0b",
  "Novos Clientes":        "#8b5cf6",
  "Iniciantes":            "#3b82f6",
  "Precisam de Atenção":   "#f97316",
  "Em Risco":              "#ef4444",
  "Hibernando":            "#94a3b8",
}

export function RfvSegmentCards({ clients, activeSegment, onSegmentClick }: Props) {
  const total = clients.length

  const segments = SEGMENT_ORDER.map((seg) => {
    const group = clients.filter((c) => c.segment === seg)
    const value = group.reduce((s, c) => s + c.totalValue, 0)
    const pct = total ? Math.round((group.length / total) * 100) : 0
    return { seg, count: group.length, value, pct }
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
      {/* Todos */}
      <button
        onClick={() => onSegmentClick("Todos")}
        className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
          activeSegment === "Todos"
            ? "bg-foreground text-background border-foreground"
            : "bg-card border-border text-foreground"
        }`}
      >
        <p className="text-xs font-semibold truncate">Todos</p>
        <p className="text-xl font-bold mt-1">{total}</p>
        <p className="text-xs opacity-70 mt-0.5">100%</p>
      </button>

      {segments.map(({ seg, count, pct }) => {
        const colors = SEGMENT_COLORS[seg]
        const isActive = activeSegment === seg
        return (
          <button
            key={seg}
            onClick={() => onSegmentClick(seg)}
            style={{ borderLeftColor: SEGMENT_HEX[seg], borderLeftWidth: 3 }}
            className={`rounded-xl border border-border p-3 text-left transition-all hover:shadow-sm ${
              isActive ? "ring-2 ring-offset-1" : ""
            } bg-card`}
          >
            <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{seg}</p>
            <p className="text-xl font-bold text-foreground mt-1">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pct}%</p>
          </button>
        )
      })}
    </div>
  )
}
