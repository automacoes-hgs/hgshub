"use client"

import type { ClientRfv, RfvSegment } from "@/lib/rfv"

type Props = {
  clients: ClientRfv[]
}

// Matriz 3x3: eixo X = Recência (baixa→alta), eixo Y = Frequência+Valor (baixa→alta)
// Células da matriz (9 posições) mapeadas em segmentos
type Cell = {
  label: string
  segment: RfvSegment | null
  color: string
  rMin: number
  rMax: number
  fvMin: number
  fvMax: number
}

const MATRIX_CELLS: Cell[] = [
  // linha de cima (alta freq+valor)
  { label: "Não Perder",    segment: "Precisam de Atenção", color: "#ef4444", rMin: 1, rMax: 2, fvMin: 4, fvMax: 5 },
  { label: "Clientes Fiéis",segment: "Fiéis",               color: "#10b981", rMin: 3, rMax: 3, fvMin: 4, fvMax: 5 },
  { label: "Campeões",      segment: "Campeões",            color: "#059669", rMin: 4, rMax: 5, fvMin: 4, fvMax: 5 },
  // linha do meio
  { label: "Em Risco",      segment: "Em Risco",            color: "#f59e0b", rMin: 1, rMax: 2, fvMin: 2, fvMax: 3 },
  { label: "Precisam de Atenção", segment: "Precisam de Atenção", color: "#fb923c", rMin: 3, rMax: 3, fvMin: 2, fvMax: 3 },
  { label: "Potenciais",    segment: "Promissores",         color: "#8b5cf6", rMin: 4, rMax: 5, fvMin: 2, fvMax: 3 },
  // linha de baixo (baixa freq+valor)
  { label: "Hibernando",    segment: "Hibernando",          color: "#64748b", rMin: 1, rMax: 2, fvMin: 1, fvMax: 1 },
  { label: "Prestes a Hibernar", segment: "Iniciantes",    color: "#a78bfa", rMin: 3, rMax: 3, fvMin: 1, fvMax: 1 },
  { label: "Perdidos",      segment: null,                  color: "#dc2626", rMin: 1, rMax: 2, fvMin: 1, fvMax: 1 },
  // linha de novos (recência alta, freq+valor baixo)
  { label: "Promissores",   segment: "Novos Clientes",      color: "#7c3aed", rMin: 4, rMax: 5, fvMin: 1, fvMax: 1 },
  { label: "Novos",         segment: "Novos Clientes",      color: "#6366f1", rMin: 5, rMax: 5, fvMin: 1, fvMax: 1 },
]

// Simplified: mostra 9 células fixas da matriz padrão RFV
const MATRIX_3X3 = [
  // (row=0 = topo = alta fv, col=0 = esquerda = baixa recência)
  { label: "Não Perder",          color: "#ef4444",  row: 0, col: 0 },
  { label: "Clientes Fiéis",      color: "#10b981",  row: 0, col: 1 },
  { label: "Campeões",            color: "#059669",  row: 0, col: 2 },
  { label: "Em Risco",            color: "#f59e0b",  row: 1, col: 0 },
  { label: "Precisam de Atenção", color: "#fb923c",  row: 1, col: 1 },
  { label: "Potenciais",          color: "#8b5cf6",  row: 1, col: 2 },
  { label: "Hibernando",          color: "#64748b",  row: 2, col: 0 },
  { label: "Prestes a Hibernar",  color: "#a78bfa",  row: 2, col: 1 },
  { label: "Perdidos",            color: "#dc2626",  row: 2, col: 2 },
]

// Mapping de label → segmento(s) RFV para contar
const LABEL_TO_SEGMENT: Record<string, RfvSegment[]> = {
  "Não Perder":           ["Precisam de Atenção"],
  "Clientes Fiéis":       ["Fiéis"],
  "Campeões":             ["Campeões"],
  "Em Risco":             ["Em Risco"],
  "Precisam de Atenção":  ["Precisam de Atenção"],
  "Potenciais":           ["Promissores"],
  "Hibernando":           ["Hibernando"],
  "Prestes a Hibernar":   ["Iniciantes"],
  "Perdidos":             [],
}

export function RfvMatrix({ clients }: Props) {
  const total = clients.length

  function countFor(label: string) {
    const segs = LABEL_TO_SEGMENT[label] ?? []
    return clients.filter((c) => segs.includes(c.segment)).length
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <p className="text-sm font-semibold text-foreground mb-1">Matriz RFV</p>
      <div className="flex gap-4">
        {/* Y axis label */}
        <div className="flex items-center">
          <p className="text-[10px] text-muted-foreground writing-vertical rotate-180 whitespace-nowrap" style={{ writingMode: "vertical-rl" }}>
            Frequência e valor (regularidade e gasto)
          </p>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {MATRIX_3X3.map((cell) => {
              const count = countFor(cell.label)
              const pct = total ? Math.round((count / total) * 100) : 0
              return (
                <div
                  key={`${cell.row}-${cell.col}`}
                  className="rounded-lg p-3 flex flex-col gap-1"
                  style={{ backgroundColor: cell.color }}
                >
                  <p className="text-[11px] font-semibold text-white leading-tight">{cell.label}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-[11px] text-white/80">{pct}%</p>
                </div>
              )
            })}
          </div>
          {/* X axis label */}
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Recência (quão recentemente o cliente comprou)
          </p>
        </div>
      </div>
    </div>
  )
}
