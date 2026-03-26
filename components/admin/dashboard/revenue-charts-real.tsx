"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts"
import type { Contract } from "@/lib/types/contracts"
import type { ClientRfv } from "@/lib/rfv"
import type { ClientHealth } from "@/lib/health"
import { SEGMENT_COLORS } from "@/lib/rfv"

interface RevenueChartsRealProps {
  contracts: Contract[]
  clientsRfv: ClientRfv[]
  clientsHealth: ClientHealth[]
}

function fmtK(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

const SEGMENT_HEX: Record<string, string> = {
  "Campeões": "#10b981",
  "Fiéis": "#0ea5e9",
  "Promissores": "#f59e0b",
  "Novos Clientes": "#8b5cf6",
  "Iniciantes": "#3b82f6",
  "Precisam de Atenção": "#f97316",
  "Em Risco": "#ef4444",
  "Hibernando": "#94a3b8",
}

export function RevenueChartsReal({ contracts, clientsRfv, clientsHealth }: RevenueChartsRealProps) {
  // Top 8 clientes por valor mensal
  const rankingData = [...clientsHealth]
    .sort((a, b) => b.monthlyValue - a.monthlyValue)
    .slice(0, 8)
    .map((c) => ({ name: c.clientName.split(" ")[0], full: c.clientName, value: Math.round(c.monthlyValue) }))

  // Distribuição por segmento RFV
  const segmentTotals: Record<string, number> = {}
  clientsRfv.forEach((c) => {
    segmentTotals[c.segment] = (segmentTotals[c.segment] || 0) + 1
  })
  const donutData = Object.entries(segmentTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Top clientes por receita mensal</CardTitle>
          <p className="text-xs text-muted-foreground">Valor mensal estimado dos contratos ativos</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={rankingData} margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [fmtK(v), "Receita/mês"]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                labelStyle={{ color: "var(--foreground)" }}
                itemStyle={{ color: "var(--color-chart-1)" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "var(--muted-foreground)", fontSize: 11, formatter: fmtK }}>
                {rankingData.map((_, i) => (
                  <Cell key={i} fill="var(--color-chart-1)" opacity={1 - i * 0.08} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Distribuição por segmento RFV</CardTitle>
          <p className="text-xs text-muted-foreground">Clientes agrupados pela análise RFV</p>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={SEGMENT_HEX[entry.name] ?? "#888"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [`${v} cliente${v !== 1 ? "s" : ""}`, name]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
