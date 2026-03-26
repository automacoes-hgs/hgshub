import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock } from "lucide-react"
import type { Client } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ChurnAlertsProps {
  clients: Client[]
}

type Alert = {
  severity: "critical" | "warning"
  client: string
  message: string
}

function buildAlerts(clients: Client[]): Alert[] {
  const alerts: Alert[] = []

  // Críticos: health score < 40
  clients
    .filter((c) => c.healthScore < 40)
    .sort((a, b) => a.healthScore - b.healthScore)
    .forEach((c) => {
      alerts.push({
        severity: "critical",
        client: c.name,
        message: `Health score ${c.healthScore}${c.monthlyValue === 0 ? ", plano free, sem pagamento" : " (em risco de churn)"}`,
      })
    })

  // Inatividade prolongada (>14 dias)
  clients
    .filter((c) => {
      if (c.lastAccess === "never") return false
      const days = (Date.now() - new Date(c.lastAccess).getTime()) / (1000 * 60 * 60 * 24)
      return days > 14 && c.healthScore >= 40
    })
    .forEach((c) => {
      const days = Math.round((Date.now() - new Date(c.lastAccess).getTime()) / (1000 * 60 * 60 * 24))
      alerts.push({
        severity: "warning",
        client: c.name,
        message: `Sem acesso há ${days} dias`,
      })
    })

  // Contratos vencendo em ≤60 dias
  clients
    .filter((c) => c.contractDaysLeft !== null && c.contractDaysLeft <= 60 && c.healthScore >= 40)
    .sort((a, b) => (a.contractDaysLeft ?? 0) - (b.contractDaysLeft ?? 0))
    .forEach((c) => {
      alerts.push({
        severity: "warning",
        client: c.name,
        message: `Contrato vence em ${c.contractDaysLeft} dias`,
      })
    })

  return alerts
}

export function ChurnAlerts({ clients }: ChurnAlertsProps) {
  const alerts = buildAlerts(clients)

  if (alerts.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Nenhum alerta ativo no momento.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-800/60 bg-red-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Alertas ativos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-md px-3 py-2 text-sm",
              alert.severity === "critical"
                ? "bg-red-900/40 text-red-300"
                : "bg-amber-900/30 text-amber-300"
            )}
          >
            {alert.severity === "critical" ? (
              <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1" />
            ) : (
              <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-400 shrink-0 mt-1" />
            )}
            <span>
              <strong>{alert.client}</strong>
              {" — "}
              {alert.message}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
