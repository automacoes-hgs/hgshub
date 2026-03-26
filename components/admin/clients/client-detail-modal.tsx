"use client"

import { X, DollarSign, Package, CalendarDays, Lightbulb, Gift } from "lucide-react"
import { useEffect, useRef } from "react"
import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_COLORS, getRecommendation } from "@/lib/rfv"
import { getContractStatus, getDaysRemaining, getCycleDays } from "@/lib/types/contracts"
import { RfvGauge } from "./rfv-gauge"

type Props = {
  client: ClientRfv | null
  onClose: () => void
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function formatMonthYear(dateStr: string) {
  const [year, month] = dateStr.split("-")
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  return `${months[parseInt(month) - 1]}/${year}`
}

function SegmentBadge({ segment }: { segment: RfvSegment }) {
  const colors = SEGMENT_COLORS[segment]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {segment}
    </span>
  )
}

export function ClientDetailModal({ client, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  if (!client) return null

  const recommendation = getRecommendation(client.segment)

  // Contratos ordenados por data decrescente
  const sortedContracts = [...client.contracts].sort((a, b) =>
    b.purchase_date.localeCompare(a.purchase_date)
  )

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-muted-foreground">
                {client.clientName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{client.clientName}</h2>
            </div>
            <SegmentBadge segment={client.segment} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Gauges RFV */}
          <div className="grid grid-cols-4 gap-3">
            <RfvGauge value={client.recency} label="Recência" />
            <RfvGauge value={client.frequency} label="Frequência" />
            <RfvGauge value={client.monetary} label="Monetário" />
            <RfvGauge value={client.score} label="Score RFV" />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(client.totalValue)}</p>
              </div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produtos</p>
                <p className="text-sm font-bold text-foreground">{client.productCount}</p>
              </div>
            </div>
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <p className="text-sm font-bold text-foreground">{formatMonthYear(client.clientSince)}</p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground text-sm">{recommendation.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recommendation.priorityColor}`}>
                  {recommendation.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            </div>
          </div>

          {/* Histórico de Compras */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Histórico de Compras
            </h3>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status do Ciclo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Dias Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedContracts.map((contract, i) => {
                    const status = getContractStatus(contract)
                    const daysRemaining = getDaysRemaining(contract)
                    const isExpired = status === "Expirado"
                    return (
                      <tr
                        key={contract.id}
                        className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {contract.has_bonus && (
                              <Gift className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                            )}
                            <span className="text-foreground text-xs">{contract.category}</span>
                            {contract.has_bonus && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200">
                                Bônus
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-foreground">{contract.product}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(contract.purchase_date)}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(Number(contract.value))}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isExpired
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isExpired ? "⚠ Expirado" : "✓ Ativo"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {isExpired
                            ? `Vencido há ${Math.abs(daysRemaining)} dias`
                            : `${daysRemaining} dias`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
