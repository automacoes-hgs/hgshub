"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, Search } from "lucide-react"
import type { ClientHealth } from "@/lib/health"
import { SEGMENT_COLORS } from "@/lib/rfv"
import { cn } from "@/lib/utils"

interface ClientsTableRealProps {
  clientsHealth: ClientHealth[]
  selectedClient: string
  onSelectClient: (name: string) => void
}

function fmt(value: number) {
  return value > 0
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "–"
}

function scoreChip(score: number) {
  if (score >= 70) return "bg-lime-900/50 text-lime-300 border-lime-700/60"
  if (score >= 40) return "bg-amber-900/50 text-amber-300 border-amber-700/60"
  return "bg-red-900/50 text-red-300 border-red-700/60"
}

type SortKey = "clientName" | "healthScore" | "monthlyValue" | "activeContracts" | "daysSinceLastPurchase"

export function ClientsTableReal({ clientsHealth, selectedClient, onSelectClient }: ClientsTableRealProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("healthScore")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const filtered = [...clientsHealth]
    .filter((c) => c.clientName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => handleSort(col)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Todos os clientes ({clientsHealth.length})
          </CardTitle>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm border-border bg-muted/40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left"><SortHeader label="Cliente" col="clientName" /></th>
                <th className="px-4 py-2.5 text-left">
                  <span className="text-xs font-medium text-muted-foreground">Segmento RFV</span>
                </th>
                <th className="px-4 py-2.5 text-left">
                  <span className="text-xs font-medium text-muted-foreground">Plano</span>
                </th>
                <th className="px-4 py-2.5 text-right"><SortHeader label="Receita/mês" col="monthlyValue" /></th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Health Score" col="healthScore" /></th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Contratos ativos" col="activeContracts" /></th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Dias sem compra" col="daysSinceLastPurchase" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const segColors = SEGMENT_COLORS[c.rfvSegment]
                return (
                  <tr
                    key={c.clientName}
                    onClick={() => onSelectClient(selectedClient === c.clientName ? "all" : c.clientName)}
                    className={cn(
                      "border-b border-border/50 cursor-pointer transition-colors",
                      selectedClient === c.clientName ? "bg-primary/10" : "hover:bg-muted/30"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium", segColors.bg, segColors.text, segColors.border)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", segColors.dot)} />
                        {c.rfvSegment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {c.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{fmt(c.monthlyValue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded border text-xs font-semibold", scoreChip(c.healthScore))}>
                        {c.healthScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.activeContracts}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                      {c.daysSinceLastPurchase === 0 ? "Hoje" : `${c.daysSinceLastPurchase}d`}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
