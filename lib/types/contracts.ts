export type Brand = "Soluções" | "Profit" | "Academy"

export const BRANDS: Brand[] = ["Soluções", "Profit", "Academy"]

export type Category = {
  name: string
  cycleDays: number
}

export const CATEGORIES: Category[] = [
  { name: "Assessoria", cycleDays: 300 },
  { name: "Consultoria", cycleDays: 45 },
  { name: "BPO Financeiro", cycleDays: 365 },
  { name: "BPO Recursos Humanos", cycleDays: 365 },
  { name: "Academy Eventos", cycleDays: 30 },
  { name: "Academy Corporativo", cycleDays: 180 },
  { name: "Recrutamento e Seleção de Pessoas", cycleDays: 60 },
  { name: "Implantação", cycleDays: 180 },
]

export type Contract = {
  id: string
  client_name: string
  category: string
  product: string
  brand: Brand
  value: number
  purchase_date: string
  custom_end_date: string | null
  has_bonus: boolean
  observations: string | null
  secondary_brand: Brand | null
  secondary_brand_value: number | null
  created_at: string
  updated_at: string
}

export type ContractStatus = "Ativo" | "Expirado"

export function getContractCycleDays(category: string, customEndDate: string | null, purchaseDate: string): number {
  if (customEndDate) {
    const start = new Date(purchaseDate)
    const end = new Date(customEndDate)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  const cat = CATEGORIES.find((c) => c.name === category)
  return cat?.cycleDays ?? 365
}

export function getContractEndDate(contract: Contract): Date {
  if (contract.custom_end_date) return new Date(contract.custom_end_date)
  const cat = CATEGORIES.find((c) => c.name === contract.category)
  const cycleDays = cat?.cycleDays ?? 365
  const start = new Date(contract.purchase_date)
  start.setDate(start.getDate() + cycleDays)
  return start
}

export function getContractStatus(contract: Contract): ContractStatus {
  const endDate = getContractEndDate(contract)
  return endDate >= new Date() ? "Ativo" : "Expirado"
}

export function getDaysRemaining(contract: Contract): number {
  const endDate = getContractEndDate(contract)
  const now = new Date()
  return Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getCycleDays(contract: Contract): number {
  return getContractCycleDays(contract.category, contract.custom_end_date, contract.purchase_date)
}
