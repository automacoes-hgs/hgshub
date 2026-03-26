import type { Client } from "@/lib/mock-data"
import { RevenueKpiCards } from "./revenue-kpi-cards"
import { RevenueCharts } from "./revenue-charts"
import { HealthSection } from "./health-section"
import { ChurnAlerts } from "./churn-alerts"
import { ToolUsageSection } from "./tool-usage-section"

interface DashboardOverviewProps {
  clients: Client[]
}

export function DashboardOverview({ clients }: DashboardOverviewProps) {
  const activeClients = clients.filter((c) => c.status === "active" || c.status === "at_risk")
  const mrr = clients.reduce((sum, c) => sum + c.monthlyValue, 0)
  const avgTicket = activeClients.length > 0
    ? Math.round(clients.filter((c) => c.monthlyValue > 0).reduce((s, c) => s + c.monthlyValue, 0) / clients.filter((c) => c.monthlyValue > 0).length)
    : 0
  const atRisk = clients.filter((c) => c.healthScore < 40)
  const revenueAtRisk = atRisk.reduce((s, c) => s + c.monthlyValue, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Seção 1 — Receita */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Seção 1 — Receita</h2>
          <span className="text-xs text-muted-foreground">Prioridade máxima</span>
        </div>
        <RevenueKpiCards
          mrr={mrr}
          avgTicket={avgTicket}
          activeClients={activeClients.length}
          totalClients={clients.length}
          revenueAtRisk={revenueAtRisk}
          atRiskCount={atRisk.length}
        />
        <div className="mt-4">
          <RevenueCharts clients={clients} />
        </div>
      </section>

      {/* Seção 2 — Saúde */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Seção 2 — Saúde dos clientes</h2>
        <HealthSection clients={clients} />
      </section>

      {/* Seção 3 — Alertas e risco de churn */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Seção 3 — Alertas e risco de churn</h2>
        <ChurnAlerts clients={clients} />
      </section>

      {/* Seção 4 — Uso das ferramentas */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">Seção 4 — Uso das ferramentas</h2>
        <ToolUsageSection clients={clients} />
      </section>
    </div>
  )
}
