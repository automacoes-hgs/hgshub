"use client"

import { ArrowUpDown } from "lucide-react"
import type { ClientHealth } from "@/lib/health"
import { HEALTH_STATUS_CONFIG } from "@/lib/health"
import { SEGMENT_COLORS } from "@/lib/rfv"

type Props = {
  clients: ClientHealth[]
}

export function HealthTable({ clients }: Props) {
  const sorted = [...clients].sort((a, b) => a.healthScore - b.healthScore)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Tabela de Saúde dos Clientes</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Ordenado por health score (piores primeiro)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Cliente</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Health Score</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Segmento RFV</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Plano</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Último Acesso</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Dias Sem Acesso</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">Valor Mensal</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((client, i) => {
              const cfg = HEALTH_STATUS_CONFIG[client.status]
              const seg = SEGMENT_COLORS[client.rfvSegment]
              const date = new Date(client.lastPurchaseDate).toLocaleDateString("pt-BR")
              return (
                <tr
                  key={client.clientName}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  {/* Cliente */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="font-medium text-foreground">{client.clientName}</span>
                    </div>
                  </td>

                  {/* Health Score barra */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold w-8 text-right ${cfg.text}`}>
                        {client.healthScore}
                      </span>
                    </div>
                  </td>

                  {/* Segmento RFV */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${seg.bg} ${seg.text} ${seg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${seg.dot}`} />
                      {client.rfvSegment}
                    </span>
                  </td>

                  {/* Plano */}
                  <td className="px-5 py-3.5 text-muted-foreground max-w-[160px] truncate">
                    {client.plan}
                  </td>

                  {/* Último Acesso */}
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                    {date}
                  </td>

                  {/* Dias Sem Acesso */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        client.daysSinceLastPurchase > 30
                          ? "text-red-600"
                          : client.daysSinceLastPurchase > 15
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {client.daysSinceLastPurchase} dias
                    </span>
                  </td>

                  {/* Valor Mensal */}
                  <td className="px-5 py-3.5 text-right font-medium text-foreground whitespace-nowrap">
                    {client.monthlyValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
