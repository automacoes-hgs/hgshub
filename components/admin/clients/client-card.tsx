"use client"

import { Building2, DollarSign, CalendarDays } from "lucide-react"
import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_COLORS, SEGMENT_CARD_BORDER, RFV_SCORE_COLOR } from "@/lib/rfv"

type Props = {
  client: ClientRfv
  onClick: () => void
}

function formatValueShort(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)} mil`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = RFV_SCORE_COLOR(score)
  return (
    <div className="flex flex-col items-center gap-0.5 bg-muted/50 rounded-lg px-3 py-1.5 min-w-[60px]">
      <span className={`text-base font-bold ${color}`}>
        {label[0]}{score}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function SegmentBadge({ segment }: { segment: RfvSegment }) {
  const colors = SEGMENT_COLORS[segment]
  const icons: Partial<Record<RfvSegment, string>> = {
    "Campeões": "🏆",
    "Fiéis": "💙",
    "Promissores": "→",
    "Novos Clientes": "✦",
    "Iniciantes": "⭐",
    "Precisam de Atenção": "⚠",
    "Em Risco": "△",
    "Hibernando": "❄",
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className="text-[10px]">{icons[segment]}</span>
      {segment}
    </span>
  )
}

export function ClientCard({ client, onClick }: Props) {
  const borderColor = SEGMENT_CARD_BORDER[client.segment]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border border-border border-l-4 ${borderColor} rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{client.clientName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{client.productCount} contrato{client.productCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <SegmentBadge segment={client.segment} />
      </div>

      {/* Scores R/F/M */}
      <div className="flex gap-1.5">
        <ScoreBadge label="Recência" score={client.recency} />
        <ScoreBadge label="Frequência" score={client.frequency} />
        <ScoreBadge label="Monetário" score={client.monetary} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {formatValueShort(client.totalValue)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(client.lastPurchaseDate)}
        </span>
      </div>
    </button>
  )
}
