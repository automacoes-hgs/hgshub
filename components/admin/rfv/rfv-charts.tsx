"use client"

import {
  Treemap,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import type { ClientRfv, RfvSegment } from "@/lib/rfv"
import { SEGMENT_ORDER } from "@/lib/rfv"

type Props = {
  clients: ClientRfv[]
}

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

function fmtK(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}mi`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v}`
}

// Custom Treemap content
function TreemapContent(props: any) {
  const { x, y, width, height, name, value, color } = props
  if (width < 40 || height < 30) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={6} opacity={0.9} />
      <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600}>
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 8} textAnchor="middle" fill="#ffffffcc" fontSize={11}>
        {value}
      </text>
    </g>
  )
}

export function RfvCharts({ clients }: Props) {
  const segmentData = SEGMENT_ORDER.map((seg) => {
    const group = clients.filter((c) => c.segment === seg)
    return {
      name: seg,
      value: group.length,
      revenue: group.reduce((s, c) => s + c.totalValue, 0),
      color: SEGMENT_HEX[seg],
    }
  }).filter((d) => d.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Treemap — distribuição por segmento */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Distribuição por Segmento</p>
        <ResponsiveContainer width="100%" height={240}>
          <Treemap
            data={segmentData}
            dataKey="value"
            nameKey="name"
            content={<TreemapContent />}
          />
        </ResponsiveContainer>
        {/* Legenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
          {segmentData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BarChart — Receita por segmento */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Receita por Segmento</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={segmentData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              tickFormatter={fmtK}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {segmentData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
