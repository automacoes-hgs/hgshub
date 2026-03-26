import type { Contract } from "@/lib/types/contracts"
import { getContractStatus, getDaysRemaining, CATEGORIES } from "@/lib/types/contracts"
import type { RfvSegment, ClientRfv } from "@/lib/rfv"

export type HealthStatus = "Saudável" | "Atenção" | "Em Risco"

export type ClientHealth = {
  clientName: string
  healthScore: number          // 0–100
  status: HealthStatus
  rfvSegment: RfvSegment
  rfvScore: number
  plan: string                 // categoria do contrato ativo mais recente
  lastPurchaseDate: string     // data de compra mais recente
  daysSinceLastPurchase: number
  monthlyValue: number         // valor mensal estimado (valor / ciclo_dias * 30)
  totalValue: number
  activeContracts: number
  expiringContracts: number    // contratos que vencem em ≤ 30 dias
  contracts: Contract[]
}

export type HealthAlert = {
  type: "danger" | "warning" | "info"
  clientName: string
  message: string
}

function estimateMonthlyValue(contracts: Contract[]): number {
  const active = contracts.filter((c) => getContractStatus(c) === "Ativo")
  if (!active.length) return 0
  // Soma dos valores ativos dividido pelo ciclo médio em meses
  return active.reduce((sum, c) => {
    const days = getDaysRemaining(c)
    const totalDays = (() => {
      if (c.custom_end_date) {
        const start = new Date(c.purchase_date)
        const end = new Date(c.custom_end_date)
        return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
      }
      const cat = CATEGORIES.find((x) => x.name === c.category)
      return cat?.cycleDays ?? 365
    })()
    return sum + (Number(c.value) / totalDays) * 30
  }, 0)
}

export function computeHealthScore(client: ClientRfv, contracts: Contract[]): number {
  // Componentes do health score (0–100):
  // 1. RFV score normalizado (0–5 → 0–40 pts)
  const rfvComponent = (client.score / 5) * 40

  // 2. Contratos ativos (0–30 pts): ter pelo menos 1 ativo = 30pts
  const activeCount = contracts.filter((c) => getContractStatus(c) === "Ativo").length
  const activeComponent = activeCount > 0 ? Math.min(30, activeCount * 15) : 0

  // 3. Recência em dias (0–30 pts): quanto mais recente, melhor
  const daysSince = Math.round(
    (Date.now() - new Date(client.lastPurchaseDate).getTime()) / 86400000
  )
  const recencyComponent =
    daysSince <= 30  ? 30 :
    daysSince <= 90  ? 22 :
    daysSince <= 180 ? 14 :
    daysSince <= 365 ? 6  : 0

  return Math.round(Math.min(100, rfvComponent + activeComponent + recencyComponent))
}

export function computeClientsHealth(
  clientsRfv: ClientRfv[],
  allContracts: Contract[]
): ClientHealth[] {
  return clientsRfv.map((client) => {
    const contracts = allContracts.filter((c) => c.client_name === client.clientName)
    const healthScore = computeHealthScore(client, contracts)

    const status: HealthStatus =
      healthScore >= 70 ? "Saudável" :
      healthScore >= 40 ? "Atenção"  : "Em Risco"

    const lastDate = client.lastPurchaseDate
    const daysSince = Math.round(
      (Date.now() - new Date(lastDate).getTime()) / 86400000
    )

    const activeContracts = contracts.filter((c) => getContractStatus(c) === "Ativo").length

    const expiringContracts = contracts.filter((c) => {
      const days = getDaysRemaining(c)
      return days >= 0 && days <= 30
    }).length

    // Plano: categoria do contrato ativo mais recente
    const latestActive = [...contracts]
      .filter((c) => getContractStatus(c) === "Ativo")
      .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))[0]
    const plan = latestActive?.category ?? contracts[0]?.category ?? "—"

    const monthlyValue = estimateMonthlyValue(contracts)

    return {
      clientName: client.clientName,
      healthScore,
      status,
      rfvSegment: client.segment,
      rfvScore: client.score,
      plan,
      lastPurchaseDate: lastDate,
      daysSinceLastPurchase: daysSince,
      monthlyValue,
      totalValue: client.totalValue,
      activeContracts,
      expiringContracts,
      contracts,
    }
  })
}

export function generateAlerts(clients: ClientHealth[]): HealthAlert[] {
  const alerts: HealthAlert[] = []

  for (const c of clients) {
    if (c.healthScore < 40) {
      alerts.push({
        type: "danger",
        clientName: c.clientName,
        message: `${c.clientName} está em risco (score: ${c.healthScore})`,
      })
    }
    if (c.daysSinceLastPurchase > 15) {
      alerts.push({
        type: "warning",
        clientName: c.clientName,
        message: `${c.clientName} sem acesso há ${c.daysSinceLastPurchase} dias`,
      })
    }
    if (c.expiringContracts > 0) {
      const days = c.contracts
        .map((ct) => getDaysRemaining(ct))
        .filter((d) => d >= 0 && d <= 30)
        .sort((a, b) => a - b)[0]
      alerts.push({
        type: "info",
        clientName: c.clientName,
        message: `Contrato de ${c.clientName} vence em ${days} dia${days === 1 ? "" : "s"}`,
      })
    }
  }

  // Ordenar: danger > warning > info
  const order = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => order[a.type] - order[b.type])
}

export const HEALTH_STATUS_CONFIG: Record<
  HealthStatus,
  { label: string; bg: string; text: string; bar: string; dot: string }
> = {
  "Saudável": {
    label: "Saudável",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  "Atenção": {
    label: "Atenção",
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  "Em Risco": {
    label: "Em Risco",
    bg: "bg-red-50",
    text: "text-red-700",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
}
