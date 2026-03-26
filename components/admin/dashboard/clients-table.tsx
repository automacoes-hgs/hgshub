"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, Search } from "lucide-react"
import type { Client } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ClientsTableProps {
  clients: Client[]
  selectedClient: string
  onSelectClient: (id: string) => void
}

type SortKey = "name" | "plan" | "monthlyValue" | "healthScore" | "lastAccess" | "status"

function fmt(value: number) {
  return value > 0
    ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "–"
}

function formatAccess(lastAccess: string) {
  if (lastAccess === "never") return "Nunca"
  const days = Math.round((Date.now() - new Date(lastAccess).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "Hoje"
  if (days === 1) return "Ontem"
  return `${days}d atrás`
}

function scoreChip(score: number) {
  if (score >= 70) return "bg-lime-900/50 text-lime-300 border-lime-700/60"
  if (score >= 40) return "bg-amber-900/50 text-amber-300 border-amber-700/60"
  return "bg-red-900/50 text-red-300 border-red-700/60"
}

function statusBadge(status: string) {
  if (status === "active") return "bg-lime-900/50 text-lime-300 border-lime-700/60"
  if (status === "at_risk") return "bg-amber-900/50 text-amber-300 border-amber-700/60"
  return "bg-red-900/50 text-red-300 border-red-700/60"
}

const statusLabel: Record<string, string> = {
  active: "Ativo",
  at_risk: "Em risco",
  churned: "Churn",
}

export function ClientsTable({ clients, selectedClient, onSelectClient }: ClientsTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("healthScore")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const filtered = clients
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? ""
      let bv: string | number = b[sortKey] ?? ""
      if (sortKey === "lastAccess") {
        av = a.lastAccess === "never" ? 0 : new Date(a.lastAccess).getTime()
        bv = b.lastAccess === "never" ? 0 : new Date(b.lastAccess).getTime()
      }
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
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
            Todos os clientes
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
                <th className="px-4 py-2.5 text-left"><SortHeader label="Nome" col="name" /></th>
                <th className="px-4 py-2.5 text-left"><SortHeader label="Plano" col="plan" /></th>
                <th className="px-4 py-2.5 text-right"><SortHeader label="Valor R$" col="monthlyValue" /></th>
                <th className="px-4 py-2.5 text-left">
                  <span className="text-xs font-medium text-muted-foreground">Módulos</span>
                </th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Health Score" col="healthScore" /></th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Último acesso" col="lastAccess" /></th>
                <th className="px-4 py-2.5 text-center"><SortHeader label="Status" col="status" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectClient(selectedClient === c.id ? "all" : c.id)}
                  className={cn(
                    "border-b border-border/50 cursor-pointer transition-colors",
                    selectedClient === c.id
                      ? "bg-primary/10"
                      : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {c.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-mono">{fmt(c.monthlyValue)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.modules.length > 0
                        ? c.modules.map((m) => (
                            <span key={m} className="text-xs bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
                              {m.split(" ")[0]}
                            </span>
                          ))
                        : <span className="text-xs text-muted-foreground">–</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block px-2 py-0.5 rounded border text-xs font-semibold", scoreChip(c.healthScore))}>
                      {c.healthScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">{formatAccess(c.lastAccess)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block px-2 py-0.5 rounded border text-xs font-medium", statusBadge(c.status))}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
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
