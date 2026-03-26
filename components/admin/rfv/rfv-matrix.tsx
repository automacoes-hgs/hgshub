"use client"

import { TrendingUp } from "lucide-react"
import type { ClientRfv, RfvSegment } from "@/lib/rfv"

type Props = {
  clients: ClientRfv[]
}

// Matriz baseada na lógica do documento:
// Eixo Y = Frequência + Valor (FV) - de baixo (1) para cima (5)
// Eixo X = Recência (R) - da esquerda (1) para direita (5)

type MatrixCell = {
  label: string
  segments: RfvSegment[]
  color: string
  row: number  // 0 = topo (FV alto), 2 = base (FV baixo)
  col: number  // 0 = esquerda (R baixo), 4 = direita (R alto)
  colSpan?: number
}

// Layout da matriz conforme a imagem (3 linhas x 5 colunas)
const MATRIX_LAYOUT: MatrixCell[] = [
  // Linha superior (FV = 4-5)
  { label: "Não Perder",     segments: ["Precisam de Atenção"], color: "#ef4444", row: 0, col: 0, colSpan: 2 },
  { label: "Clientes Fiéis", segments: ["Fiéis"],               color: "#14b8a6", row: 0, col: 2, colSpan: 2 },
  { label: "Campeões",       segments: ["Campeões"],            color: "#22c55e", row: 0, col: 4 },

  // Linha do meio (FV = 2-3)
  { label: "Em Risco",              segments: ["Em Risco"],            color: "#f87171", row: 1, col: 0 },
  { label: "Precisam de Atenção",   segments: ["Precisam de Atenção"], color: "#facc15", row: 1, col: 1, colSpan: 2 },
  { label: "Potenciais",            segments: ["Promissores"],         color: "#a855f7", row: 1, col: 3, colSpan: 2 },

  // Linha inferior (FV = 1-2)
  { label: "Hibernando",        segments: ["Hibernando"],     color: "#f87171", row: 2, col: 0 },
  { label: "Prestes a Hibernar", segments: ["Iniciantes"],    color: "#fb923c", row: 2, col: 1 },
  { label: "Perdidos",          segments: [],                 color: "#f87171", row: 2, col: 2 },
  { label: "Promissores",       segments: ["Promissores"],    color: "#2dd4bf", row: 2, col: 3 },
  { label: "Novos",             segments: ["Novos Clientes"], color: "#2dd4bf", row: 2, col: 4 },
]

export function RfvMatrix({ clients }: Props) {
  const total = clients.length

  function countFor(segments: RfvSegment[], label: string) {
    // Se não há segmentos mapeados, retorna 0
    if (segments.length === 0) return 0
    return clients.filter((c) => segments.includes(c.segment)).length
  }

  function renderCell(cell: MatrixCell) {
    const count = countFor(cell.segments, cell.label)
    const pct = total ? Math.round((count / total) * 100) : 0

    return (
      <div
        key={`${cell.row}-${cell.col}`}
        className="rounded-lg p-3 flex flex-col justify-between min-h-[90px]"
        style={{ 
          backgroundColor: cell.color,
          gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined
        }}
      >
        <p className="text-xs font-semibold text-white leading-tight">{cell.label}</p>
        <div>
          <p className="text-2xl font-bold text-white">{count}</p>
          <p className="text-xs text-white/80">{pct}%</p>
        </div>
      </div>
    )
  }

  // Organizar células por linha
  const rows = [
    MATRIX_LAYOUT.filter((c) => c.row === 0),
    MATRIX_LAYOUT.filter((c) => c.row === 1),
    MATRIX_LAYOUT.filter((c) => c.row === 2),
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Matriz RFV</p>
      </div>
      
      <div className="flex gap-4">
        {/* Eixo Y - label vertical */}
        <div className="flex items-center justify-center">
          <p 
            className="text-[10px] text-muted-foreground whitespace-nowrap"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Frequência e valor (regularidade e gasto)
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {/* Linha 0 - FV alto */}
          <div className="grid gap-2" style={{ gridTemplateColumns: "2fr 2fr 1fr" }}>
            {rows[0].map(renderCell)}
          </div>
          
          {/* Linha 1 - FV médio */}
          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 2fr 2fr" }}>
            {rows[1].map(renderCell)}
          </div>
          
          {/* Linha 2 - FV baixo */}
          <div className="grid grid-cols-5 gap-2">
            {rows[2].map(renderCell)}
          </div>
          
          {/* Eixo X - label */}
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Recência <span className="text-muted-foreground/60">(quão recentemente o cliente comprou)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
