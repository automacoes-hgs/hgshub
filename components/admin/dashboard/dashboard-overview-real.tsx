import type { Contract } from "@/lib/types/contracts"
import type { ClientRfv } from "@/lib/rfv"
import type { ClientHealth } from "@/lib/health"
import { getContractStatus, getDaysRemaining } from "@/lib/types/contracts"
import { generateAlerts } from "@/lib/health"
import { RevenueKpiCards } from "./revenue-kpi-cards"
import { RevenueChartsReal } from "./revenue-charts-real"
import { HealthSectionReal } from "./health-section-real"
import { ChurnAlertsReal } from "./churn-alerts-real"

interface DashboardOverviewRealProps {
  contracts: Contract[]
  clientsRfv: ClientRfv[]
  clientsHealth: ClientHealth[]
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export function DashboardOverviewReal({ contracts, clientsRfv, clientsHealth }: DashboardOverviewRealProps) {
  const activeContracts = contracts.filter((c) => getContractStatus(c) === "Ativo")
  const mrr = clientsHealth.reduce((sum, c) => sum + c.monthlyValue, 0)
  const payingClients = clientsHealth.filter((c) => c.totalValue > 0)
  const avgTicket = payingClients.length > 0
    ? Math.round(payingClients.reduce((s, c) => s + c.monthlyValue, 0) / payingClients.length)
    : 0
  const atRisk = clientsHealth.filter((c) => c.healthScore < 40)
  const revenueAtRisk = atRisk.reduce((s, c) => s + c.monthlyValue, 0)
  const alerts = generateAlerts(clientsHealth)

  return (
    <div className="flex flex-col gap-8">
      {/* Receita */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Receita</h2>
          <span className="text-xs text-muted-foreground">calculado com base nos contratos ativos</span>
        </div>
        <RevenueKpiCards
          mrr={mrr}
          avgTicket={avgTicket}
          activeClients={clientsHealth.filter((c) => c.activeContracts > 0).length}
          totalClients={clientsHealth.length}
          revenueAtRisk={revenueAtRisk}
          atRiskCount={atRisk.length}
        />
        <RevenueChartsReal contracts={contracts} clientsRfv={clientsRfv} clientsHealth={clientsHealth} />
      </section>

      {/* Saúde */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Saúde dos clientes</h2>
        <HealthSectionReal clientsHealth={clientsHealth} />
      </section>

      {/* Alertas */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Alertas de churn</h2>
        <ChurnAlertsReal alerts={alerts} />
      </section>
    </div>
  )
}
