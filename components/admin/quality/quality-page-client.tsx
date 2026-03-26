"use client"

import { useMemo } from "react"
import type { Contract } from "@/lib/types/contracts"
import { computeClientsRfv } from "@/lib/rfv"
import { computeClientsHealth, generateAlerts } from "@/lib/health"
import { QualityKpiCards } from "./quality-kpi-cards"
import { QualityCharts } from "./quality-charts"
import { HealthTable } from "./health-table"
import { QualityAlerts } from "./quality-alerts"

type Props = {
  contracts: Contract[]
}

export function QualityPageClient({ contracts }: Props) {
  const clientsRfv = useMemo(() => computeClientsRfv(contracts), [contracts])
  const clientsHealth = useMemo(
    () => computeClientsHealth(clientsRfv, contracts),
    [clientsRfv, contracts]
  )
  const alerts = useMemo(() => generateAlerts(clientsHealth), [clientsHealth])

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Qualidade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitoramento de saúde, engajamento e alertas da base de clientes
        </p>
      </div>

      {/* KPI Cards */}
      <QualityKpiCards clients={clientsHealth} />

      {/* Gráficos */}
      <QualityCharts clients={clientsHealth} />

      {/* Layout: tabela à esquerda, alertas à direita */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <HealthTable clients={clientsHealth} />
        </div>
        <div>
          <QualityAlerts alerts={alerts} />
        </div>
      </div>
    </div>
  )
}
