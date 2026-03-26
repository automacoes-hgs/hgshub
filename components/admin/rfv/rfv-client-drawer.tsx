"use client"

import { X } from "lucide-react"
import type { ClientRfv } from "@/lib/rfv"
import { SEGMENT_COLORS, getRecommendation } from "@/lib/rfv"
import { getContractStatus, getDaysRemaining } from "@/lib/types/contracts"

type Props = {
  client: ClientRfv | null
  onClose: () => void
}

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = (value / 5) * 100
  return (
    <div className="bg-muted/40 rounded-xl p-4 text-center">
      <div className="relative w-16 h-10 mx-auto mb-2">
        <svg viewBox="0 0 64 36" className="w-full h-full">
          <path d="M4 32 A28 28 0 0 1 60 32" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <path
            d="M4 32 A28 28 0 0 1 60 32"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 88} 88`}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-base font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">de 5</p>
      <p className="text-xs font-medium text-foreground mt-1">{label}</p>
    </div>
  )
}

function scoreColor(s: number) {
  if (s >= 4) return "#10b981"
  if (s >= 3) return "#f59e0b"
  return "#ef4444"
}

export function RfvClientDrawer({ client, onClose }: Props) {
  if (!client) return null

  const rec = getRecommendation(client.segment)
  const colors = SEGMENT_COLORS[client.segment]
  const sortedContracts = [...client.contracts].sort((a, b) =>
    b.purchase_date.localeCompare(a.purchase_date)
  )
  const clientSinceFormatted = new Date(client.clientSince + "T00:00:00").toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  })

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-background shadow-2xl z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border sticky top-0 bg-background">
          <div>
            <h2 className="text-lg font-bold text-foreground">{client.clientName}</h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${colors.bg} ${colors.text} ${colors.border}`}>
              {client.segment}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Score gauges */}
          <div className="grid grid-cols-4 gap-3">
            <ScoreGauge value={client.recency}   label="Recência"   color={scoreColor(client.recency)} />
            <ScoreGauge value={client.frequency} label="Frequência" color={scoreColor(client.frequency)} />
            <ScoreGauge value={client.monetary}  label="Monetário"  color={scoreColor(client.monetary)} />
            <ScoreGauge value={client.score}     label="Score RFV"  color={scoreColor(client.score)} />
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-foreground mt-1">
                R$ {client.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Produtos</p>
              <p className="text-lg font-bold text-foreground mt-1">{client.productCount}</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Cliente desde</p>
              <p className="text-lg font-bold text-foreground mt-1">{clientSinceFormatted}</p>
            </div>
          </div>

          {/* Recomendação */}
          <div className="bg-muted/30 border border-border rounded-xl p-4 flex gap-3 items-start">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-lg">💡</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.priorityColor}`}>{rec.priority}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
            </div>
          </div>

          {/* Histórico de compras */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Histórico de Compras</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Produto</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Data</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground">Dias Rest.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedContracts.map((c) => {
                    const status = getContractStatus(c)
                    const days = getDaysRemaining(c)
                    return (
                      <tr key={c.id} className="hover:bg-muted/20">
                        <td className="py-2 px-3 text-foreground">
                          <div>{c.category}</div>
                          {c.has_bonus && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">Bônus</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-foreground">{c.product}</td>
                        <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                          {new Date(c.purchase_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          R$ {Number(c.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3">
                          {status === "Ativo" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-medium">
                              Expirado
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground whitespace-nowrap text-xs">
                          {days >= 0 ? `${days} dias` : `Vencido há ${Math.abs(days)} dias`}
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
    </>
  )
}
