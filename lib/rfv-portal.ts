// Lógica RFV — scoring por quintis dinâmicos, escala 1–5

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
  recency: number        // R_score 1–5
  frequency: number      // F_score 1–5
  monetary: number       // V_score 1–5
  fv: number             // FV = round((F+V)/2), 1–5
  score: number          // média (R+F+V)/3 para exibição, 1.0–5.0
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
  if (sorted.length === 1) return sorted[0]
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/**
 * Dá score de 1–5 por quintis dinâmicos.
 * inverter=true → valores menores recebem score maior (usado para recência).
 */
function scoreQuintis(valor: number, todos: number[], inverter = false): number {
  const sorted = [...todos].sort((a, b) => a - b)
  const p20 = percentil(sorted, 0.20)
  const p40 = percentil(sorted, 0.40)
  const p60 = percentil(sorted, 0.60)
  const p80 = percentil(sorted, 0.80)

  let score: number
  if (valor <= p20)      score = 1
  else if (valor <= p40) score = 2
  else if (valor <= p60) score = 3
  else if (valor <= p80) score = 4
  else                   score = 5

  return inverter ? 6 - score : score
}

// ── Mapeamento R × FV → Segmento ─────────────────────────────────────────────
//
// Escala 1–5 colapsada em 3 zonas:
//   R: baixo (1–2) | médio (3) | alto (4–5)
//  FV: baixo (1)   | médio (2–3) | alto (4–5)
//
//            R baixo       R médio        R alto
// FV alto    Não Perder    Clientes Fiéis  Campeões
// FV médio   Em Risco      Precisam Aten.  Potenciais
// FV baixo   Hibernando    Prestes Hiber.  Perdidos

function classificar(r: number, fv: number): PortalRfvSegment {
  const rZone  = r  <= 2 ? "low" : r  <= 3 ? "mid" : "high"
  const fvZone = fv <= 1 ? "low" : fv <= 3 ? "mid" : "high"

  if (fvZone === "high") {
    if (rZone === "high") return "Campeões"
    if (rZone === "mid")  return "Clientes Fiéis"
    return "Não Perder"
  }
  if (fvZone === "mid") {
    if (rZone === "high") return "Potenciais"
    if (rZone === "mid")  return "Precisam de Atenção"
    return "Em Risco"
  }
  // fvZone === "low"
  if (rZone === "high") return "Perdidos"
  if (rZone === "mid")  return "Prestes a Hibernar"
  return "Hibernando"
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
    recencyDays: number
    orderCount: number
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

  // Passo 2: arrays globais para quintis dinâmicos
  const allRecencies = rawList.map((c) => c.recencyDays)
  const allFreqs     = rawList.map((c) => c.orderCount)
  const allValues    = rawList.map((c) => c.totalValue)

  // Passo 3: calcular scores e segmentar
  return rawList.map((c) => {
    const r  = scoreQuintis(c.recencyDays, allRecencies, true)  // menor dias → score maior
    const f  = scoreQuintis(c.orderCount,  allFreqs,     false)
    const v  = scoreQuintis(c.totalValue,  allValues,    false)
    const fv = Math.round((f + v) / 2)
    const score = Math.round(((r + f + v) / 3) * 10) / 10      // 1.0–5.0

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

// ── Grid da Matriz RFV (visual 3×3, escala 1–5 por baixo) ───────────────────
// Linhas: FV alto (topo) → FV médio → FV baixo (base)
// Colunas: R baixo (esq) → R médio → R alto (dir)

export const MATRIX_GRID: {
  label: string
  seg: PortalRfvSegment
  matrixBg: string
  matrixText: string
  rZone: string
  fvZone: string
}[][] = [
  [
    { label: "Não Perder",          seg: "Não Perder",          matrixBg: "#E74C3C", matrixText: "#fff", rZone: "low",  fvZone: "high" },
    { label: "Clientes Fiéis",      seg: "Clientes Fiéis",      matrixBg: "#2ECC71", matrixText: "#fff", rZone: "mid",  fvZone: "high" },
    { label: "Campeões",            seg: "Campeões",            matrixBg: "#27AE60", matrixText: "#fff", rZone: "high", fvZone: "high" },
  ],
  [
    { label: "Em Risco",            seg: "Em Risco",            matrixBg: "#F39C12", matrixText: "#fff", rZone: "low",  fvZone: "mid"  },
    { label: "Precisam de Atenção", seg: "Precisam de Atenção", matrixBg: "#E67E22", matrixText: "#fff", rZone: "mid",  fvZone: "mid"  },
    { label: "Potenciais",          seg: "Potenciais",          matrixBg: "#5DADE2", matrixText: "#fff", rZone: "high", fvZone: "mid"  },
  ],
  [
    { label: "Hibernando",          seg: "Hibernando",          matrixBg: "#95A5A6", matrixText: "#fff", rZone: "low",  fvZone: "low"  },
    { label: "Prestes a Hibernar",  seg: "Prestes a Hibernar",  matrixBg: "#7F8C8D", matrixText: "#fff", rZone: "mid",  fvZone: "low"  },
    { label: "Perdidos",            seg: "Perdidos",            matrixBg: "#BDC3C7", matrixText: "#555", rZone: "high", fvZone: "low"  },
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
