"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_COLORS, RFV_SCORE_COLOR } from "@/lib/rfv"
import { RfvClientDrawer } from "./rfv-client-drawer"

type SortKey = "clientName" | "recency" | "frequency" | "monetary" | "score" | "totalValue" | "lastPurchaseDate"

type Props = {
  clients: ClientRfv[]
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = RFV_SCORE_COLOR(score)
  return (
    <div className="text-center">
      <span className={`text-sm font-bold ${color}`}>R{score}</span>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

export function RfvTable({ clients }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [selected, setSelected] = useState<ClientRfv | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const sorted = [...clients].sort((a, b) => {
    let av: string | number = a[sortKey] as string | number
    let bv: string | number = b[sortKey] as string | number
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv, "pt-BR") : bv.localeCompare(av, "pt-BR")
    }
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-30" />
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground"
      >
        <span className="flex items-center gap-1">{label}<SortIcon k={k} /></span>
      </th>
    )
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Tabela Detalhada</p>
          <p className="text-xs text-muted-foreground">{clients.length} clientes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <Th label="Cliente" k="clientName" />
                <Th label="R" k="recency" />
                <Th label="F" k="frequency" />
                <Th label="M" k="monetary" />
                <Th label="Score" k="score" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Segmento</th>
                <Th label="Valor Total" k="totalValue" />
                <Th label="Último Contrato" k="lastPurchaseDate" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((c) => {
                const colors = SEGMENT_COLORS[c.segment]
                return (
                  <tr
                    key={c.clientName}
                    onClick={() => setSelected(c)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{c.clientName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${RFV_SCORE_COLOR(c.recency)}`}>{c.recency}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${RFV_SCORE_COLOR(c.frequency)}`}>{c.frequency}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${RFV_SCORE_COLOR(c.monetary)}`}>{c.monetary}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-base ${RFV_SCORE_COLOR(c.score)}`}>{c.score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      R$ {c.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(c.lastPurchaseDate + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RfvClientDrawer client={selected} onClose={() => setSelected(null)} />
    </>
  )
}
