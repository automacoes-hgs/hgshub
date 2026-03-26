export type Client = {
  id: string
  name: string
  plan: "Enterprise" | "Professional" | "Starter" | "Free"
  monthlyValue: number
  healthScore: number
  modules: string[]
  lastAccess: string // ISO date string or "never"
  status: "active" | "at_risk" | "churned"
  contractDaysLeft: number | null
}

export const MOCK_CLIENTS: Client[] = [
  {
    id: "tech-solutions",
    name: "Tech Solutions",
    plan: "Enterprise",
    monthlyValue: 5000,
    healthScore: 90,
    modules: ["BDR Performance", "Metas & OKRs", "Análise RFV"],
    lastAccess: new Date().toISOString(),
    status: "active",
    contractDaysLeft: 180,
  },
  {
    id: "consultoria-abc",
    name: "Consultoria ABC",
    plan: "Professional",
    monthlyValue: 3200,
    healthScore: 60,
    modules: ["Metas & OKRs", "Análise RFV"],
    lastAccess: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    contractDaysLeft: 45,
  },
  {
    id: "empresa-demo",
    name: "Empresa Demo",
    plan: "Professional",
    monthlyValue: 2500,
    healthScore: 75,
    modules: ["BDR Performance", "Metas & OKRs"],
    lastAccess: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    contractDaysLeft: 120,
  },
  {
    id: "moda-express",
    name: "Moda Express",
    plan: "Starter",
    monthlyValue: 800,
    healthScore: 35,
    modules: ["Análise RFV"],
    lastAccess: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: "at_risk",
    contractDaysLeft: 60,
  },
  {
    id: "industria-norte",
    name: "Indústria Norte",
    plan: "Free",
    monthlyValue: 0,
    healthScore: 20,
    modules: [],
    lastAccess: "never",
    status: "at_risk",
    contractDaysLeft: null,
  },
]

export const PERIODS = [
  { value: "jan2026", label: "Janeiro 2026" },
  { value: "fev2026", label: "Fevereiro 2026" },
  { value: "mar2026", label: "Março 2026" },
]

export const MODULES = [
  { value: "all", label: "Todos os módulos" },
  { value: "bdr", label: "BDR Performance" },
  { value: "metas", label: "Metas & OKRs" },
  { value: "rfv", label: "Análise RFV" },
]
