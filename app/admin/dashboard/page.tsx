"use client"

import { useState } from "react"
import { DashboardFilters } from "@/components/admin/dashboard/dashboard-filters"
import { DashboardOverview } from "@/components/admin/dashboard/dashboard-overview"
import { ClientDetailView } from "@/components/admin/dashboard/client-detail-view"
import { ClientsTable } from "@/components/admin/dashboard/clients-table"
import { MOCK_CLIENTS } from "@/lib/mock-data"

export default function DashboardPage() {
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedModule, setSelectedModule] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("mar2026")

  const activeClient = selectedClient !== "all"
    ? MOCK_CLIENTS.find((c) => c.id === selectedClient)
    : null

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Barra de filtros */}
      <DashboardFilters
        clients={MOCK_CLIENTS}
        selectedClient={selectedClient}
        selectedModule={selectedModule}
        selectedPeriod={selectedPeriod}
        onClientChange={setSelectedClient}
        onModuleChange={setSelectedModule}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Conteúdo principal: visão geral ou visão de cliente */}
      {activeClient ? (
        <ClientDetailView client={activeClient} module={selectedModule} />
      ) : (
        <DashboardOverview clients={MOCK_CLIENTS} />
      )}

      {/* Tabela de clientes — sempre visível */}
      <ClientsTable
        clients={MOCK_CLIENTS}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
      />
    </div>
  )
}
