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
} from "recharts"
import type { Client } from "@/lib/mock-data"

interface HealthSectionProps {
  clients: Client[]
}

function scoreColor(score: number) {
  if (score >= 70) return "#97C459"
  if (score >= 40) return "#EF9F27"
  return "#E24B4A"
}

function scoreLabel(score: number) {
  if (score >= 70) return "text-lime-400 border-lime-800/60 bg-lime-950/50"
  if (score >= 40) return "text-amber-400 border-amber-800/60 bg-amber-950/50"
  return "text-red-400 border-red-800/60 bg-red-950/50"
}

export function HealthSection({ clients }: HealthSectionProps) {
  const healthy = clients.filter((c) => c.healthScore >= 70)
  const attention = clients.filter((c) => c.healthScore >= 40 && c.healthScore < 70)
  const atrisk = clients.filter((c) => c.healthScore < 40)

  const barData = [...clients]
    .sort((a, b) => b.healthScore - a.healthScore)
    .map((c) => ({ name: c.name, score: c.healthScore }))

  const pct = (n: number) => `${Math.round((n / clients.length) * 100)}%`

  const summaryCards = [
    {
      label: "Saudáveis (≥70)",
      count: healthy.length,
      pct: pct(healthy.length),
      cls: "text-lime-400 border-lime-800/60 bg-lime-950/50",
      valueCls: "text-lime-200",
    },
    {
      label: "Em atenção (40–69)",
      count: attention.length,
      pct: pct(attention.length),
      cls: "text-amber-400 border-amber-800/60 bg-amber-950/50",
      valueCls: "text-amber-200",
    },
    {
      label: "Em risco (<40)",
      count: atrisk.length,
      pct: pct(atrisk.length),
      cls: "text-red-400 border-red-800/60 bg-red-950/50",
      valueCls: "text-red-200",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* 3 cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className={`border ${card.cls}`}>
            <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
              <p className={`text-xs font-medium ${card.cls.split(" ")[0]}`}>{card.label}</p>
              <p className={`text-2xl font-bold ${card.valueCls}`}>
                {card.count} cliente{card.count !== 1 ? "s" : ""}
              </p>
              <p className={`text-xs ${card.cls.split(" ")[0]}`}>{card.pct}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de barras horizontais — health score por cliente */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Health score por cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v, "Score"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11 }}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
