"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import type { Client } from "@/lib/mock-data"

interface RevenueChartsProps {
  clients: Client[]
}

const PLAN_COLORS: Record<string, string> = {
  Enterprise: "#185FA5",
  Professional: "#534AB7",
  Starter: "#1D9E75",
  Free: "#888780",
}

function fmt(value: number) {
  return `R$ ${value.toLocaleString("pt-BR")}`
}

export function RevenueCharts({ clients }: RevenueChartsProps) {
  // Ranking por receita
  const rankingData = [...clients]
    .sort((a, b) => b.monthlyValue - a.monthlyValue)
    .map((c) => ({ name: c.name, value: c.monthlyValue, plan: c.plan }))

  // Distribuição por plano (donut)
  const planCounts: Record<string, number> = {}
  clients.forEach((c) => {
    planCounts[c.plan] = (planCounts[c.plan] || 0) + 1
  })
  const donutData = Object.entries(planCounts).map(([plan, count]) => ({
    name: plan,
    value: count,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Ranking de clientes por receita */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Top clientes por receita</CardTitle>
          <p className="text-xs text-muted-foreground">Ranking por valor mensal (R$)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              layout="vertical"
              data={rankingData}
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [fmt(v), "Valor"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#93c5fd" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11, formatter: (v: number) => fmt(v) }}>
                {rankingData.map((entry, i) => (
                  <Cell key={i} fill="#185FA5" opacity={1 - i * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição por plano */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Distribuição por plano</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={3}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={PLAN_COLORS[entry.name] || "#888"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [v, name]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
