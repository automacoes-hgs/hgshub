// Lógica RFV — scoring por terços dinâmicos, matriz 3×3 conforme especificação

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
  | "Clientes Fiéis"
  | "Não Perder"
  | "Potenciais"
  | "Precisam de Atenção"
  | "Em Risco"
  | "Perdidos"
  | "Prestes a Hibernar"
  | "Hibernando"

export type PortalClientRfv = {
  customerName: string
  entries: PortalRfvEntry[]
  recency: number        // R_score 1–3
  frequency: number      // F_score 1–3
  monetary: number       // V_score 1–3
  fv: number             // FV = round((F+V)/2), 1–3
  score: number          // média (R+F+V)/3 para exibição
  segment: PortalRfvSegment
  totalValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
  recencyDays: number
  orderCount: number
}

// ── Helpers de percentil ─────────────────────────────────────────────────────

/** Calcula o percentil p (0–1) de um array numérico ordenado */
function percentil(sorted: number[], p: number): number {
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/**
 * Dá score de 1–3 por terços dinâmicos.
 * inverter=true → valores menores recebem score maior (usado para recência).
 */
function scoreTermos(valor: number, todos: number[], inverter = false): number {
  const sorted = [...todos].sort((a, b) => a - b)
  const p33 = percentil(sorted, 1 / 3)
  const p66 = percentil(sorted, 2 / 3)

  let score: number
  if (valor <= p33) score = 1
  else if (valor <= p66) score = 2
  else score = 3

  return inverter ? 4 - score : score
}

// ── Mapeamento R × FV → Segmento ─────────────────────────────────────────────
// Conforme documento:
//              R=1 (Antigo)      R=2 (Médio)        R=3 (Recente)
// FV=3 (Alto)  Não Perder        Clientes Fiéis      Campeões
// FV=2 (Médio) Em Risco          Precisam Atenção    Potenciais
// FV=1 (Baixo) Hibernando        Prestes Hibernar    Perdidos

const SEGMENT_MAP: Record<number, Record<number, PortalRfvSegment>> = {
  3: { 1: "Não Perder",    2: "Clientes Fiéis",      3: "Campeões"          },
  2: { 1: "Em Risco",      2: "Precisam de Atenção", 3: "Potenciais"        },
  1: { 1: "Hibernando",    2: "Prestes a Hibernar",  3: "Perdidos"          },
}

function classificar(r: number, fv: number): PortalRfvSegment {
  return SEGMENT_MAP[fv]?.[r] ?? "Precisam de Atenção"
}

// ── Engine principal ─────────────────────────────────────────────────────────

export function computePortalRfv(entries: PortalRfvEntry[]): PortalClientRfv[] {
  if (entries.length === 0) return []

  // Agrupa por cliente
  const byCustomer = new Map<string, PortalRfvEntry[]>()
  for (const e of entries) {
    const key = e.customer_name.trim().toLowerCase()
    if (!byCustomer.has(key)) byCustomer.set(key, [])
    byCustomer.get(key)!.push(e)
  }

  // Data de referência = hoje ou data mais recente dos dados (o que for maior)
  const allTimestamps = entries.map((e) => new Date(e.purchase_date + "T00:00:00").getTime())
  const referenceDate = Math.max(Date.now(), ...allTimestamps)

  // Passo 1: agregar R, F, V brutos por cliente
  type Raw = {
    customerName: string
    entries: PortalRfvEntry[]
    recencyDays: number   // dias desde última compra
    orderCount: number    // datas únicas de compra
    totalValue: number
    lastPurchaseDate: string
    firstPurchaseDate: string
  }

  const rawList: Raw[] = Array.from(byCustomer.entries()).map(([, customerEntries]) => {
    const customerName = customerEntries[0].customer_name.trim()
    const uniqueDates = [...new Set(customerEntries.map((e) => e.purchase_date))].sort()
    const orderCount = uniqueDates.length
    const totalValue = customerEntries.reduce((s, e) => s + Number(e.value), 0)
    const lastPurchaseDate = uniqueDates[uniqueDates.length - 1]
    const firstPurchaseDate = uniqueDates[0]
    const recencyDays = Math.round(
      (referenceDate - new Date(lastPurchaseDate + "T00:00:00").getTime()) / 86400000
    )
    return { customerName, entries: customerEntries, recencyDays, orderCount, totalValue, lastPurchaseDate, firstPurchaseDate }
  })

  // Passo 2: arrays globais para terços dinâmicos
  const allRecencies  = rawList.map((c) => c.recencyDays)
  const allFreqs      = rawList.map((c) => c.orderCount)
  const allValues     = rawList.map((c) => c.totalValue)

  // Passo 3 + 4: calcular scores e posicionar na matriz
  return rawList.map((c) => {
    const r  = scoreTermos(c.recencyDays, allRecencies, true)   // menor dias → score maior
    const f  = scoreTermos(c.orderCount,  allFreqs,     false)
    const v  = scoreTermos(c.totalValue,  allValues,    false)
    const fv = Math.round((f + v) / 2) as 1 | 2 | 3             // eixo vertical da matriz
    const score = Math.round(((r + f + v) / 3) * 10) / 10

    return {
      customerName: c.customerName,
      entries: c.entries,
      recency: r,
      frequency: f,
      monetary: v,
      fv,
      score,
      segment: classificar(r, fv),
      totalValue: c.totalValue,
      lastPurchaseDate: c.lastPurchaseDate,
      firstPurchaseDate: c.firstPurchaseDate,
      recencyDays: c.recencyDays,
      orderCount: c.orderCount,
    }
  })
}

// ── Cores dos segmentos ──────────────────────────────────────────────────────

export const PORTAL_SEGMENT_COLORS: Record<
  PortalRfvSegment,
  { bg: string; text: string; border: string; dot: string; card: string; hex: string }
> = {
  "Campeões":            { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", card: "bg-emerald-500",  hex: "#27AE60" },
  "Clientes Fiéis":      { bg: "bg-green-50",    text: "text-green-700",   border: "border-green-200",   dot: "bg-green-500",   card: "bg-green-500",    hex: "#2ECC71" },
  "Não Perder":          { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     card: "bg-red-500",      hex: "#E74C3C" },
  "Em Risco":            { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500",  card: "bg-orange-500",   hex: "#F39C12" },
  "Precisam de Atenção": { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   card: "bg-amber-500",    hex: "#E67E22" },
  "Potenciais":          { bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-500",     card: "bg-sky-500",      hex: "#5DADE2" },
  "Perdidos":            { bg: "bg-zinc-100",    text: "text-zinc-500",    border: "border-zinc-200",    dot: "bg-zinc-400",    card: "bg-zinc-300",     hex: "#BDC3C7" },
  "Prestes a Hibernar":  { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400",   card: "bg-slate-400",    hex: "#7F8C8D" },
  "Hibernando":          { bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-500",   card: "bg-slate-500",    hex: "#95A5A6" },
}

export const PORTAL_SEGMENT_ORDER: PortalRfvSegment[] = [
  "Campeões",
  "Clientes Fiéis",
  "Não Perder",
  "Potenciais",
  "Precisam de Atenção",
  "Em Risco",
  "Perdidos",
  "Prestes a Hibernar",
  "Hibernando",
]

// ── Grid da Matriz RFV 3×3 ───────────────────────────────────────────────────
// Linhas: FV=3 (topo) → FV=2 → FV=1 (base)
// Colunas: R=1 (esq) → R=2 → R=3 (dir)

export const MATRIX_GRID: {
  label: string
  seg: PortalRfvSegment
  matrixBg: string
  matrixText: string
  r: number
  fv: number
}[][] = [
  [
    { label: "Não Perder",          seg: "Não Perder",          matrixBg: "#E74C3C", matrixText: "#fff", r: 1, fv: 3 },
    { label: "Clientes Fiéis",      seg: "Clientes Fiéis",      matrixBg: "#2ECC71", matrixText: "#fff", r: 2, fv: 3 },
    { label: "Campeões",            seg: "Campeões",            matrixBg: "#27AE60", matrixText: "#fff", r: 3, fv: 3 },
  ],
  [
    { label: "Em Risco",            seg: "Em Risco",            matrixBg: "#F39C12", matrixText: "#fff", r: 1, fv: 2 },
    { label: "Precisam de Atenção", seg: "Precisam de Atenção", matrixBg: "#E67E22", matrixText: "#fff", r: 2, fv: 2 },
    { label: "Potenciais",          seg: "Potenciais",          matrixBg: "#5DADE2", matrixText: "#fff", r: 3, fv: 2 },
  ],
  [
    { label: "Hibernando",          seg: "Hibernando",          matrixBg: "#95A5A6", matrixText: "#fff", r: 1, fv: 1 },
    { label: "Prestes a Hibernar",  seg: "Prestes a Hibernar",  matrixBg: "#7F8C8D", matrixText: "#fff", r: 2, fv: 1 },
    { label: "Perdidos",            seg: "Perdidos",            matrixBg: "#BDC3C7", matrixText: "#555", r: 3, fv: 1 },
  ],
]

// ── Cores para gráfico donut ─────────────────────────────────────────────────

export const SEGMENT_CHART_COLORS: Record<PortalRfvSegment, string> = {
  "Campeões":            "#27AE60",
  "Clientes Fiéis":      "#2ECC71",
  "Não Perder":          "#E74C3C",
  "Em Risco":            "#F39C12",
  "Precisam de Atenção": "#E67E22",
  "Potenciais":          "#5DADE2",
  "Perdidos":            "#BDC3C7",
  "Prestes a Hibernar":  "#7F8C8D",
  "Hibernando":          "#95A5A6",
}

// ── Utilitários ──────────────────────────────────────────────────────────────

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
