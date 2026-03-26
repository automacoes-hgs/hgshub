// Lógica RFV adaptada para client_rfv_entries (portal do cliente)
// Mesma engine do admin, mas operando sobre as entradas do portal

export type PortalRfvEntry = {
  id: string
  owner_id: string
  customer_name: string
  product_id: string | null
  product_name: string
  value: number
  payment_method: string
  purchase_date: string
  notes: string | null
  created_at: string
}

export type PortalRfvSegment =
  | "Campeões"
  | "Fiéis"
  | "Promissores"
  | "Novos Clientes"
  | "Iniciantes"
  | "Precisam de Atenção"
  | "Em Risco"
  | "Hibernando"

export type PortalClientRfv = {
  customerName: string
  entries: PortalRfvEntry[]
  recency: number
  frequency: number
  monetary: number
  score: number
  segment: PortalRfvSegment
  totalValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
}

function recencyScore(lastDate: string): number {
  const days = Math.round((Date.now() - new Date(lastDate).getTime()) / 86400000)
  if (days <= 30) return 5
  if (days <= 90) return 4
  if (days <= 180) return 3
  if (days <= 365) return 2
  return 1
}

function frequencyScore(count: number): number {
  if (count >= 10) return 5
  if (count >= 6) return 4
  if (count >= 3) return 3
  if (count >= 2) return 2
  return 1
}

function monetaryScore(total: number): number {
  if (total >= 200000) return 5
  if (total >= 80000) return 4
  if (total >= 30000) return 3
  if (total >= 10000) return 2
  return 1
}

function deriveSegment(r: number, f: number, m: number): PortalRfvSegment {
  if (r >= 4 && f >= 4 && m >= 4) return "Campeões"
  if (r >= 3 && f >= 4) return "Fiéis"
  if (r >= 4 && f <= 2) return "Promissores"
  if (r >= 4 && f === 1 && m <= 2) return "Novos Clientes"
  const score = (r + f + m) / 3
  if (score >= 4) return "Iniciantes"
  if (r <= 2 && f >= 3 && m >= 3) return "Precisam de Atenção"
  if (r <= 2 && f >= 2) return "Em Risco"
  return "Hibernando"
}

export function computePortalRfv(entries: PortalRfvEntry[]): PortalClientRfv[] {
  const byCustomer = new Map<string, PortalRfvEntry[]>()
  for (const e of entries) {
    if (!byCustomer.has(e.customer_name)) byCustomer.set(e.customer_name, [])
    byCustomer.get(e.customer_name)!.push(e)
  }

  return Array.from(byCustomer.entries()).map(([customerName, customerEntries]) => {
    const totalValue = customerEntries.reduce((s, e) => s + Number(e.value), 0)
    const dates = customerEntries.map((e) => e.purchase_date).sort()
    const lastPurchaseDate = dates[dates.length - 1]
    const firstPurchaseDate = dates[0]
    const r = recencyScore(lastPurchaseDate)
    const f = frequencyScore(customerEntries.length)
    const m = monetaryScore(totalValue)
    const score = Math.round(((r + f + m) / 3) * 10) / 10
    return {
      customerName,
      entries: customerEntries,
      recency: r,
      frequency: f,
      monetary: m,
      score,
      segment: deriveSegment(r, f, m),
      totalValue,
      lastPurchaseDate,
      firstPurchaseDate,
    }
  })
}

export const PORTAL_SEGMENT_COLORS: Record<PortalRfvSegment, { bg: string; text: string; border: string; dot: string; card: string }> = {
  "Campeões":              { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500",  card: "bg-emerald-500" },
  "Fiéis":                 { bg: "bg-sky-50",       text: "text-sky-700",      border: "border-sky-200",      dot: "bg-sky-500",      card: "bg-sky-500" },
  "Promissores":           { bg: "bg-amber-50",     text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500",    card: "bg-amber-500" },
  "Novos Clientes":        { bg: "bg-violet-50",    text: "text-violet-700",   border: "border-violet-200",   dot: "bg-violet-500",   card: "bg-violet-500" },
  "Iniciantes":            { bg: "bg-blue-50",      text: "text-blue-700",     border: "border-blue-200",     dot: "bg-blue-500",     card: "bg-blue-500" },
  "Precisam de Atenção":   { bg: "bg-orange-50",    text: "text-orange-700",   border: "border-orange-200",   dot: "bg-orange-500",   card: "bg-orange-500" },
  "Em Risco":              { bg: "bg-red-50",       text: "text-red-700",      border: "border-red-200",      dot: "bg-red-500",      card: "bg-red-500" },
  "Hibernando":            { bg: "bg-slate-100",    text: "text-slate-600",    border: "border-slate-200",    dot: "bg-slate-400",    card: "bg-slate-400" },
}

export const PORTAL_SEGMENT_ORDER: PortalRfvSegment[] = [
  "Campeões", "Fiéis", "Promissores", "Novos Clientes",
  "Iniciantes", "Precisam de Atenção", "Em Risco", "Hibernando",
]

// Cores para gráfico donut
export const SEGMENT_CHART_COLORS: Record<PortalRfvSegment, string> = {
  "Campeões":            "#10b981",
  "Fiéis":               "#0ea5e9",
  "Promissores":         "#f59e0b",
  "Novos Clientes":      "#8b5cf6",
  "Iniciantes":          "#3b82f6",
  "Precisam de Atenção": "#f97316",
  "Em Risco":            "#ef4444",
  "Hibernando":          "#94a3b8",
}

export function fmtValue(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
}

export const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  boleto: "Boleto",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência",
  outros: "Outros",
}
