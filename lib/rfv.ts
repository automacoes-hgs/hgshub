import type { Contract } from "@/lib/types/contracts"
import { getContractStatus, getDaysRemaining } from "@/lib/types/contracts"

export type RfvSegment =
  | "Campeões"
  | "Fiéis"
  | "Promissores"
  | "Novos Clientes"
  | "Iniciantes"
  | "Precisam de Atenção"
  | "Em Risco"
  | "Hibernando"

export type ClientRfv = {
  clientName: string
  contracts: Contract[]
  recency: number      // 1–5
  frequency: number    // 1–5
  monetary: number     // 1–5
  score: number        // média dos 3
  segment: RfvSegment
  totalValue: number
  lastPurchaseDate: string
  productCount: number
  clientSince: string  // YYYY-MM-DD da compra mais antiga
}

/** Recência: dias desde o último contrato ativo ou a data mais recente */
function recencyScore(contracts: Contract[]): number {
  const sortedDates = [...contracts]
    .map((c) => c.purchase_date)
    .sort((a, b) => b.localeCompare(a))
  const lastDate = sortedDates[0]
  const daysSince = Math.round(
    (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSince <= 30) return 5
  if (daysSince <= 90) return 4
  if (daysSince <= 180) return 3
  if (daysSince <= 365) return 2
  return 1
}

/** Frequência: nº de contratos */
function frequencyScore(contracts: Contract[]): number {
  const count = contracts.length
  if (count >= 10) return 5
  if (count >= 6) return 4
  if (count >= 3) return 3
  if (count >= 2) return 2
  return 1
}

/** Monetário: valor total */
function monetaryScore(totalValue: number): number {
  if (totalValue >= 200000) return 5
  if (totalValue >= 80000) return 4
  if (totalValue >= 30000) return 3
  if (totalValue >= 10000) return 2
  return 1
}

function deriveSegment(r: number, f: number, m: number): RfvSegment {
  // Campeões: notas altas nas três dimensões
  if (r >= 4 && f >= 4 && m >= 4) return "Campeões"

  // Novos Clientes: compra muito recente (R5), primeiro pedido
  if (r === 5 && f === 1) return "Novos Clientes"

  // Iniciantes: compra recente (R4), primeiro pedido
  if (r === 4 && f === 1) return "Iniciantes"

  // Fiéis: recência alta, frequência média-alta (≥3)
  if (r >= 4 && f >= 3) return "Fiéis"

  // Promissores: recência alta, frequência baixa (≥2 pedidos, mas não campeão/fiel)
  if (r >= 4 && f >= 2) return "Promissores"

  // Precisam de Atenção: recência média (R3), alguma frequência
  if (r === 3 && f >= 2) return "Precisam de Atenção"

  // Em Risco: recência baixa, múltiplos pedidos
  if (r <= 2 && f >= 2) return "Em Risco"

  // Hibernando: recência baixa/média com poucos pedidos
  return "Hibernando"
}

export function computeClientsRfv(contracts: Contract[]): ClientRfv[] {
  // Agrupar por cliente
  const byClient = new Map<string, Contract[]>()
  for (const c of contracts) {
    if (!byClient.has(c.client_name)) byClient.set(c.client_name, [])
    byClient.get(c.client_name)!.push(c)
  }

  return Array.from(byClient.entries()).map(([clientName, clientContracts]) => {
    const totalValue = clientContracts.reduce((sum, c) => sum + Number(c.value), 0)
    const dates = [...clientContracts].map((c) => c.purchase_date).sort()
    const lastPurchaseDate = dates[dates.length - 1]
    const clientSince = dates[0]

    const r = recencyScore(clientContracts)
    const f = frequencyScore(clientContracts)
    const m = monetaryScore(totalValue)
    const score = Math.round(((r + f + m) / 3) * 10) / 10
    const segment = deriveSegment(r, f, m)

    return {
      clientName,
      contracts: clientContracts,
      recency: r,
      frequency: f,
      monetary: m,
      score,
      segment,
      totalValue,
      lastPurchaseDate,
      productCount: clientContracts.length,
      clientSince,
    }
  })
}

export const SEGMENT_COLORS: Record<RfvSegment, { bg: string; text: string; border: string; dot: string }> = {
  "Campeões":          { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500" },
  "Fiéis":             { bg: "bg-sky-50",       text: "text-sky-700",      border: "border-sky-200",      dot: "bg-sky-500" },
  "Promissores":       { bg: "bg-amber-50",     text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500" },
  "Novos Clientes":    { bg: "bg-violet-50",    text: "text-violet-700",   border: "border-violet-200",   dot: "bg-violet-500" },
  "Iniciantes":        { bg: "bg-blue-50",      text: "text-blue-700",     border: "border-blue-200",     dot: "bg-blue-500" },
  "Precisam de Atenção": { bg: "bg-orange-50",  text: "text-orange-700",   border: "border-orange-200",   dot: "bg-orange-500" },
  "Em Risco":          { bg: "bg-red-50",       text: "text-red-700",      border: "border-red-200",      dot: "bg-red-500" },
  "Hibernando":        { bg: "bg-slate-100",    text: "text-slate-600",    border: "border-slate-200",    dot: "bg-slate-400" },
}

export const SEGMENT_CARD_BORDER: Record<RfvSegment, string> = {
  "Campeões":            "border-l-emerald-400",
  "Fiéis":               "border-l-sky-400",
  "Promissores":         "border-l-amber-400",
  "Novos Clientes":      "border-l-violet-400",
  "Iniciantes":          "border-l-blue-400",
  "Precisam de Atenção": "border-l-orange-400",
  "Em Risco":            "border-l-red-400",
  "Hibernando":          "border-l-slate-400",
}

export const RFV_SCORE_COLOR: (score: number) => string = (score) => {
  if (score >= 4) return "text-emerald-600"
  if (score >= 3) return "text-amber-500"
  return "text-red-500"
}

export const SEGMENT_ORDER: RfvSegment[] = [
  "Campeões", "Fiéis", "Promissores", "Novos Clientes",
  "Iniciantes", "Precisam de Atenção", "Em Risco", "Hibernando",
]

export function getRecommendation(segment: RfvSegment): {
  title: string
  priority: string
  priorityColor: string
  description: string
} {
  const map: Record<RfvSegment, ReturnType<typeof getRecommendation>> = {
    "Campeões": {
      title: "Manter e Expandir",
      priority: "Prioridade Alta",
      priorityColor: "bg-emerald-100 text-emerald-700",
      description: "Cliente estratégico. Ofereça produtos premium, convites VIP e programas de fidelidade exclusivos.",
    },
    "Fiéis": {
      title: "Aprofundar Relacionamento",
      priority: "Prioridade Alta",
      priorityColor: "bg-sky-100 text-sky-700",
      description: "Cliente consistente. Apresente produtos complementares e benefícios de fidelidade.",
    },
    "Promissores": {
      title: "Converter em Fiel",
      priority: "Prioridade Média",
      priorityColor: "bg-amber-100 text-amber-700",
      description: "Potencial de crescimento. Invista em onboarding e ofereça pacotes de upgrade.",
    },
    "Novos Clientes": {
      title: "Ativação e Engajamento",
      priority: "Prioridade Média",
      priorityColor: "bg-violet-100 text-violet-700",
      description: "Cliente recente. Garanta uma excelente experiência inicial e acompanhe de perto.",
    },
    "Iniciantes": {
      title: "Desenvolver Potencial",
      priority: "Prioridade Média",
      priorityColor: "bg-blue-100 text-blue-700",
      description: "Perfil promissor. Apresente mais produtos e construa confiança com entregas de valor.",
    },
    "Precisam de Atenção": {
      title: "Reengajar com Urgência",
      priority: "Atenção Necessária",
      priorityColor: "bg-orange-100 text-orange-700",
      description: "Sinais de queda de engajamento. Entre em contato proativamente e apresente novidades.",
    },
    "Em Risco": {
      title: "Campanha de Retenção",
      priority: "Risco Elevado",
      priorityColor: "bg-red-100 text-red-700",
      description: "Cliente em risco de churn. Acione oferta especial de renovação ou reunião estratégica.",
    },
    "Hibernando": {
      title: "Reativação",
      priority: "Baixa Prioridade",
      priorityColor: "bg-slate-100 text-slate-600",
      description: "Cliente inativo. Tente reativação com proposta diferenciada ou pesquisa de satisfação.",
    },
  }
  return map[segment]
}
