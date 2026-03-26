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
import { AlertTriangle } from "lucide-react"
import type { Client } from "@/lib/mock-data"

interface ToolUsageSectionProps {
  clients: Client[]
}

const MODULE_COLORS: Record<string, string> = {
  "BDR Performance": "#185FA5",
  "Metas & OKRs": "#1D9E75",
  "Análise RFV": "#534AB7",
}

function formatLastAccess(lastAccess: string): { label: string; warn: boolean } {
  if (lastAccess === "never") return { label: "Nunca acessou", warn: true }
  const days = Math.round((Date.now() - new Date(lastAccess).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return { label: "Hoje", warn: false }
  if (days === 1) return { label: "Ontem", warn: false }
  if (days > 14) return { label: `Há ${days} dias`, warn: true }
  return { label: `Há ${days} dias`, warn: false }
}

export function ToolUsageSection({ clients }: ToolUsageSectionProps) {
  // Contar clientes por módulo
  const moduleCounts: Record<string, number> = {
    "BDR Performance": 0,
    "Metas & OKRs": 0,
    "Análise RFV": 0,
  }
  clients.forEach((c) => {
    c.modules.forEach((m) => {
      if (moduleCounts[m] !== undefined) moduleCounts[m]++
    })
  })
  const moduleData = Object.entries(moduleCounts).map(([name, count]) => ({ name, count }))

  // Último acesso por cliente (ordenado por mais recente)
  const accessData = [...clients].sort((a, b) => {
    if (a.lastAccess === "never") return 1
    if (b.lastAccess === "never") return -1
    return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime()
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Módulos contratados */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Módulos contratados</CardTitle>
          <p className="text-xs text-muted-foreground">Quantos clientes por módulo</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              layout="vertical"
              data={moduleData}
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, clients.length]} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v, "Clientes"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11 }}>
                {moduleData.map((entry, i) => (
                  <Cell key={i} fill={MODULE_COLORS[entry.name] || "#888"} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Último acesso por cliente */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">Último acesso por cliente</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {accessData.map((c) => {
            const { label, warn } = formatLastAccess(c.lastAccess)
            return (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{c.name}</span>
                <span className={`flex items-center gap-1 ${warn ? "text-amber-400" : "text-muted-foreground"}`}>
                  {warn && <AlertTriangle className="h-3 w-3" />}
                  {label}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
