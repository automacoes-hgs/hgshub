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
  score: number          // soma R+F+V, escala 3–15
  segment: PortalRfvSegment
  totalValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
  recencyDays: number
  orderCount: number
}

// ── Helpers de quintis ───────────────────────────────────────────────────────

/**
 * Atribui score de quintil (1–5) para cada elemento usando rank(method='first'):
 * desempate por ordem de aparição antes de dividir em quintis. Isso garante
 * grupos de tamanho igual mesmo com muitos empates.
 *
 * inverter=true → quintil 1 (menores) recebe score 5 (usado para recência:
 * menor recencyDays = comprou mais recentemente = score melhor).
 */
function scoreQuintisArray(values: number[], inverter = false): number[] {
  const n = values.length
  if (n === 0) return []
  if (n === 1) return [3] // único cliente: score médio

  // Cria array de índices e ordena pelo valor; empates mantêm ordem de aparição (stable sort)
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v || a.i - b.i) // stable: menor valor primeiro, empate por posição original

  // Atribui rank 0..n-1 de acordo com a posição no array ordenado
  const rank = new Array<number>(n)
  for (let pos = 0; pos < n; pos++) {
    rank[indexed[pos].i] = pos
  }

  // Converte rank em quintil 1–5
  return rank.map((r) => {
    const quintil = Math.floor((r / n) * 5) + 1          // 1 a 5
    const score   = Math.min(quintil, 5)                  // garante ≤ 5
    return inverter ? 6 - score : score
  })
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

  // Agrupa por cliente (case-insensitive, sem espaços extras)
  const byCustomer = new Map<string, PortalRfvEntry[]>()
  for (const e of entries) {
    const key = e.customer_name.trim().toLowerCase()
    if (!byCustomer.has(key)) byCustomer.set(key, [])
    byCustomer.get(key)!.push(e)
  }

  // Data de referência = MAX(purchase_date) de todo o dataset + 1 dia
  // Garante que o cliente mais recente tenha recencyDays = 0 e não distorça os quintis
  const maxDateStr = entries.reduce(
    (max, e) => (e.purchase_date > max ? e.purchase_date : max),
    entries[0].purchase_date
  )
  const referenceMs =
    new Date(maxDateStr + "T00:00:00").getTime() + 86400000 // +1 dia em ms

  // Passo 1: agregar métricas brutas por cliente
  type Raw = {
    customerName: string
    entries: PortalRfvEntry[]
    recencyDays: number      // referenceDate - última_compra (dias)
    freqDias: number         // COUNT DISTINCT(purchase_date) — dias únicos com compra
    totalValue: number       // SUM(value)
    ticketMedio: number      // totalValue / freqDias
    lastPurchaseDate: string
    firstPurchaseDate: string
    orderCount: number       // total de linhas (para exibição)
  }

  const rawList: Raw[] = Array.from(byCustomer.entries()).map(([, customerEntries]) => {
    const customerName    = customerEntries[0].customer_name.trim()
    const allDates        = customerEntries.map((e) => e.purchase_date)
    const uniqueDates     = Array.from(new Set(allDates))                         // dias únicos
    const sortedDates     = [...allDates].sort()
    const lastPurchaseDate  = sortedDates[sortedDates.length - 1]
    const firstPurchaseDate = sortedDates[0]
    const totalValue      = customerEntries.reduce((s, e) => s + Number(e.value), 0)
    const freqDias        = uniqueDates.length                                    // COUNT DISTINCT(data)
    const ticketMedio     = freqDias > 0 ? totalValue / freqDias : 0             // valor_total / frequência
    const recencyDays     = Math.round(
      (referenceMs - new Date(lastPurchaseDate + "T00:00:00").getTime()) / 86400000
    )
    return {
      customerName, entries: customerEntries,
      recencyDays, freqDias, totalValue, ticketMedio,
      lastPurchaseDate, firstPurchaseDate,
      orderCount: customerEntries.length,
    }
  })

  // Passo 2: arrays globais para quintis — ordem de aparição preservada (desempate por posição)
  const allRecencies   = rawList.map((c) => c.recencyDays)
  const allFreqs       = rawList.map((c) => c.freqDias)
  const allTickets     = rawList.map((c) => c.ticketMedio)

  // Calcula scores em lote (cada array retorna um score por índice)
  const rScores = scoreQuintisArray(allRecencies, true)   // menor dias → score maior
  const fScores = scoreQuintisArray(allFreqs,     false)  // maior freq  → score maior
  const vScores = scoreQuintisArray(allTickets,   false)  // maior ticket → score maior

  // Passo 3: montar resultado final
  return rawList.map((c, i) => {
    const r     = rScores[i]
    const f     = fScores[i]
    const v     = vScores[i]
    const fv    = Math.round((f + v) / 2)
    const score = r + f + v  // soma 3–15

    return {
      customerName:     c.customerName,
      entries:          c.entries,
      recency:          r,
      frequency:        f,
      monetary:         v,
      fv,
      score,
      segment:          classificar(r, fv),
      totalValue:       c.totalValue,
      lastPurchaseDate: c.lastPurchaseDate,
      firstPurchaseDate: c.firstPurchaseDate,
      recencyDays:      c.recencyDays,
      orderCount:       c.orderCount,
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
