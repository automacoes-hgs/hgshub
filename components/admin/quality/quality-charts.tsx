"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import type { ClientHealth } from "@/lib/health"
import { SEGMENT_COLORS, SEGMENT_ORDER } from "@/lib/rfv"
import type { RfvSegment } from "@/lib/rfv"

type Props = {
  clients: ClientHealth[]
}

const SCORE_RANGES = [
  { label: "0–20",  min: 0,  max: 20,  fill: "#ef4444" },
  { label: "21–40", min: 21, max: 40,  fill: "#f97316" },
  { label: "41–60", min: 41, max: 60,  fill: "#eab308" },
  { label: "61–80", min: 61, max: 80,  fill: "#22c55e" },
  { label: "81–100",min: 81, max: 100, fill: "#10b981" },
]

const PIE_COLORS: Partial<Record<RfvSegment, string>> = {
  "Campeões":            "#10b981",
  "Fiéis":               "#0ea5e9",
  "Promissores":         "#f59e0b",
  "Novos Clientes":      "#8b5cf6",
  "Iniciantes":          "#3b82f6",
  "Precisam de Atenção": "#f97316",
  "Em Risco":            "#ef4444",
  "Hibernando":          "#94a3b8",
}

export function QualityCharts({ clients }: Props) {
  // Dados do BarChart
  const barData = SCORE_RANGES.map((range) => ({
    label: range.label,
    count: clients.filter((c) => c.healthScore >= range.min && c.healthScore <= range.max).length,
    fill: range.fill,
  }))

  // Dados do PieChart — só exibir segmentos com pelo menos 1 cliente
  const segmentCounts = new Map<RfvSegment, number>()
  for (const c of clients) {
    segmentCounts.set(c.rfvSegment, (segmentCounts.get(c.rfvSegment) ?? 0) + 1)
  }
  const pieData = SEGMENT_ORDER
    .filter((seg) => (segmentCounts.get(seg) ?? 0) > 0)
    .map((seg) => ({
      name: seg,
      value: segmentCounts.get(seg) ?? 0,
      color: PIE_COLORS[seg] ?? "#94a3b8",
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* BarChart: distribuição de health score */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Distribuição por Health Score</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value} clientes`, "Quantidade"]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PieChart: distribuição por segmento RFV */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Distribuição por Segmento RFV</h2>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="40%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} clientes`, name]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: 13,
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </div>
    </div>
  )
}
