"use client"

import { useState, useMemo } from "react"
import type { Contract } from "@/lib/types/contracts"
import type { ClientRfv } from "@/lib/rfv"
import type { ClientHealth } from "@/lib/health"
import { DashboardOverviewReal } from "./dashboard-overview-real"
import { DashboardFiltersReal } from "./dashboard-filters-real"
import { ClientsTableReal } from "./clients-table-real"
import { ClientDetailViewReal } from "./client-detail-view-real"

interface DashboardClientProps {
  contracts: Contract[]
  clientsRfv: ClientRfv[]
  clientsHealth: ClientHealth[]
}

export function DashboardClient({ contracts, clientsRfv, clientsHealth }: DashboardClientProps) {
  const [selectedClient, setSelectedClient] = useState<string>("all")

  const activeClientHealth = useMemo(
    () => selectedClient !== "all"
      ? clientsHealth.find((c) => c.clientName === selectedClient) ?? null
      : null,
    [selectedClient, clientsHealth]
  )

  const activeClientRfv = useMemo(
    () => selectedClient !== "all"
      ? clientsRfv.find((c) => c.clientName === selectedClient) ?? null
      : null,
    [selectedClient, clientsRfv]
  )

  return (
    <div className="flex flex-col gap-6 pb-10">
      <DashboardFiltersReal
        clientNames={clientsHealth.map((c) => c.clientName)}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        totalContracts={contracts.length}
        totalClients={clientsHealth.length}
      />

      {activeClientHealth && activeClientRfv ? (
        <ClientDetailViewReal
          clientHealth={activeClientHealth}
          clientRfv={activeClientRfv}
        />
      ) : (
        <DashboardOverviewReal
          contracts={contracts}
          clientsRfv={clientsRfv}
          clientsHealth={clientsHealth}
        />
      )}

      <ClientsTableReal
        clientsHealth={clientsHealth}
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
      />
    </div>
  )
}
