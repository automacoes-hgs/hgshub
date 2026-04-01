// Lógica RFV adaptada para client_rfv_entries (portal do cliente)
// Implementa scoring dinâmico por quintis conforme especificação Dr. Saúde

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
  | "Não Perder"
  | "Clientes Fiéis"
  | "Em Risco"
  | "Potenciais"
  | "Precisam de Atenção"
  | "Novos"
  | "Promissores"
  | "Prestes a Hibernar"
  | "Perdidos"
  | "Hibernando"

export type PortalClientRfv = {
  customerName: string
  entries: PortalRfvEntry[]
  recency: number       // R_score (1-5)
  frequency: number     // F_score (1-5)
  monetary: number      // V_score (1-5)
  score: number         // média (R+F+V)/3
  segment: PortalRfvSegment
  totalValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
  recencyDays: number
  orderCount: number    // pedidos únicos por dia
}

// ── STEP 1+2: Scoring por quintis dinâmicos ─────────────────────────────────

/**
 * Calcula o score de 1-5 por percentil do valor dentro de todos os valores.
 * inverter=true → valores menores recebem score maior (usado para recência).
 */
function calcularScore(valor: number, todos: number[], inverter = false): number {
  const ordenado = [...todos].sort((a, b) => a - b)
  const pos = ordenado.filter((v) => v <= valor).length
  const percentil = pos / ordenado.length
  let score = Math.ceil(percentil * 5)
  score = Math.max(1, Math.min(5, score))
  return inverter ? 6 - score : score
}

// ── STEP 3: Classificação em segmentos (ordem de prioridade exata) ───────────

function classificarSegmento(r: number, f: number, v: number): PortalRfvSegment {
  if (r >= 4 && f >= 4 && v >= 4) return "Campeões"
  if (r <= 2 && f >= 4 && v >= 4) return "Não Perder"
  if (f >= 4 && v >= 4)           return "Clientes Fiéis"
  if (r <= 2 && f >= 3 && v >= 3) return "Em Risco"
  if (r === 5 && f === 1)         return "Novos"
  if (r >= 4 && f <= 2)           return "Potenciais"
  if (r >= 3 && f <= 2 && v <= 2) return "Promissores"
  if ((r === 2 || r === 3) && f <= 2 && v <= 2) return "Prestes a Hibernar"
  if (r === 1 && f <= 2)          return "Perdidos"
  if (r <= 2 && f <= 2)           return "Hibernando"
  return "Precisam de Atenção"
}

// ── Engine principal ─────────────────────────────────────────────────────────

export function computePortalRfv(entries: PortalRfvEntry[]): PortalClientRfv[] {
  if (entries.length === 0) return []

  // Agrupa por cliente
  const byCustomer = new Map<string, PortalRfvEntry[]>()
  for (const e of entries) {
    if (!byCustomer.has(e.customer_name)) byCustomer.set(e.customer_name, [])
    byCustomer.get(e.customer_name)!.push(e)
  }

  // Calcula data de referência = data mais recente nos dados (ou hoje, o que for maior)
  const allDates = entries.map((e) => new Date(e.purchase_date + "T00:00:00").getTime())
  const maxDataDate = Math.max(...allDates)
  const today = Date.now()
  const referenceDate = Math.max(maxDataDate, today)

  // Etapa 1: agregar R, F, V brutos por cliente
  type RawCustomer = {
    customerName: string
    entries: PortalRfvEntry[]
    recencyDays: number
    orderCount: number   // dias únicos = pedidos únicos
    totalValue: number
    lastPurchaseDate: string
    firstPurchaseDate: string
  }

  const rawCustomers: RawCustomer[] = Array.from(byCustomer.entries()).map(([customerName, customerEntries]) => {
    // Pedidos únicos: agrupar por data (cada dia único = 1 pedido)
    const uniqueDates = new Set(customerEntries.map((e) => e.purchase_date))
    const orderCount = uniqueDates.size

    const totalValue = customerEntries.reduce((s, e) => s + Number(e.value), 0)
    const dates = [...uniqueDates].sort()
    const lastPurchaseDate = dates[dates.length - 1]
    const firstPurchaseDate = dates[0]
    const recencyDays = Math.round(
      (referenceDate - new Date(lastPurchaseDate + "T00:00:00").getTime()) / 86400000
    )

    return { customerName, entries: customerEntries, recencyDays, orderCount, totalValue, lastPurchaseDate, firstPurchaseDate }
  })

  // Etapa 2: extrair arrays para quintis
  const todosRecencias  = rawCustomers.map((c) => c.recencyDays)
  const todasFrequencias = rawCustomers.map((c) => c.orderCount)
  const todosValores    = rawCustomers.map((c) => c.totalValue)

  // Etapa 3: calcular scores e segmentos
  return rawCustomers.map((c) => {
    const r = calcularScore(c.recencyDays,  todosRecencias,   true)   // inverter: menos dias = melhor
    const f = calcularScore(c.orderCount,   todasFrequencias, false)
    const v = calcularScore(c.totalValue,   todosValores,     false)
    const score = Math.round(((r + f + v) / 3) * 10) / 10

    return {
      customerName: c.customerName,
      entries: c.entries,
      recency: r,
      frequency: f,
      monetary: v,
      score,
      segment: classificarSegmento(r, f, v),
      totalValue: c.totalValue,
      lastPurchaseDate: c.lastPurchaseDate,
      firstPurchaseDate: c.firstPurchaseDate,
      recencyDays: c.recencyDays,
      orderCount: c.orderCount,
    }
  })
}

// ── STEP 5: Cores dos segmentos ──────────────────────────────────────────────

export const PORTAL_SEGMENT_COLORS: Record<
  PortalRfvSegment,
  { bg: string; text: string; border: string; dot: string; card: string; hex: string }
> = {
  "Campeões":            { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500",  card: "bg-emerald-500",  hex: "#1ABC9C" },
  "Clientes Fiéis":      { bg: "bg-green-50",    text: "text-green-700",    border: "border-green-200",    dot: "bg-green-500",    card: "bg-green-500",    hex: "#2ECC71" },
  "Não Perder":          { bg: "bg-red-50",      text: "text-red-700",      border: "border-red-200",      dot: "bg-red-500",      card: "bg-red-500",      hex: "#E74C3C" },
  "Em Risco":            { bg: "bg-orange-50",   text: "text-orange-700",   border: "border-orange-200",   dot: "bg-orange-500",   card: "bg-orange-500",   hex: "#E67E22" },
  "Precisam de Atenção": { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500",    card: "bg-amber-500",    hex: "#F39C12" },
  "Potenciais":          { bg: "bg-violet-50",   text: "text-violet-700",   border: "border-violet-200",   dot: "bg-violet-500",   card: "bg-violet-500",   hex: "#9B59B6" },
  "Promissores":         { bg: "bg-sky-50",      text: "text-sky-700",      border: "border-sky-200",      dot: "bg-sky-500",      card: "bg-sky-500",      hex: "#3498DB" },
  "Novos":               { bg: "bg-teal-50",     text: "text-teal-700",     border: "border-teal-200",     dot: "bg-teal-500",     card: "bg-teal-500",     hex: "#1ABC9C" },
  "Prestes a Hibernar":  { bg: "bg-slate-100",   text: "text-slate-600",    border: "border-slate-200",    dot: "bg-slate-400",    card: "bg-slate-400",    hex: "#95A5A6" },
  "Perdidos":            { bg: "bg-zinc-100",    text: "text-zinc-500",     border: "border-zinc-200",     dot: "bg-zinc-400",     card: "bg-zinc-300",     hex: "#BDC3C7" },
  "Hibernando":          { bg: "bg-slate-100",   text: "text-slate-500",    border: "border-slate-200",    dot: "bg-slate-500",    card: "bg-slate-500",    hex: "#7F8C8D" },
}

export const PORTAL_SEGMENT_ORDER: PortalRfvSegment[] = [
  "Campeões",
  "Clientes Fiéis",
  "Não Perder",
  "Potenciais",
  "Precisam de Atenção",
  "Em Risco",
  "Promissores",
  "Novos",
  "Prestes a Hibernar",
  "Perdidos",
  "Hibernando",
]

// ── STEP 4: Grid da Matriz RFV (3 linhas × 3 colunas) ───────────────────────
// Linha 0 = F+V alto (topo), Coluna 0 = Recência baixa (esquerda)

export const MATRIX_GRID: {
  label: string
  seg: PortalRfvSegment
  matrixBg: string      // cor de fundo da célula na matriz
  matrixText: string
}[][] = [
  // Linha 1 — F+V Alto
  [
    { label: "Não Perder",     seg: "Não Perder",     matrixBg: "#E74C3C", matrixText: "#fff" },
    { label: "Clientes Fiéis", seg: "Clientes Fiéis", matrixBg: "#2ECC71", matrixText: "#fff" },
    { label: "Campeões",       seg: "Campeões",       matrixBg: "#1ABC9C", matrixText: "#fff" },
  ],
  // Linha 2 — F+V Médio
  [
    { label: "Em Risco",            seg: "Em Risco",            matrixBg: "#E67E22", matrixText: "#fff" },
    { label: "Precisam de Atenção", seg: "Precisam de Atenção", matrixBg: "#F39C12", matrixText: "#fff" },
    { label: "Potenciais",          seg: "Potenciais",          matrixBg: "#9B59B6", matrixText: "#fff" },
  ],
  // Linha 3 — F+V Baixo
  [
    { label: "Hibernando",        seg: "Hibernando",        matrixBg: "#7F8C8D", matrixText: "#fff" },
    { label: "Prestes a Hibernar", seg: "Prestes a Hibernar", matrixBg: "#95A5A6", matrixText: "#fff" },
    { label: "Perdidos",          seg: "Perdidos",          matrixBg: "#BDC3C7", matrixText: "#555" },
  ],
]

// Células extras fora do grid 3x3 principal (Promissores e Novos)
export const MATRIX_EXTRA: {
  label: string
  seg: PortalRfvSegment
  matrixBg: string
  matrixText: string
}[] = [
  { label: "Promissores", seg: "Promissores", matrixBg: "#3498DB", matrixText: "#fff" },
  { label: "Novos",       seg: "Novos",       matrixBg: "#1ABC9C", matrixText: "#fff" },
]

// Cores para gráfico donut
export const SEGMENT_CHART_COLORS: Record<PortalRfvSegment, string> = {
  "Campeões":            "#1ABC9C",
  "Clientes Fiéis":      "#2ECC71",
  "Não Perder":          "#E74C3C",
  "Em Risco":            "#E67E22",
  "Precisam de Atenção": "#F39C12",
  "Potenciais":          "#9B59B6",
  "Promissores":         "#3498DB",
  "Novos":               "#1ABC9C",
  "Prestes a Hibernar":  "#95A5A6",
  "Perdidos":            "#BDC3C7",
  "Hibernando":          "#7F8C8D",
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
