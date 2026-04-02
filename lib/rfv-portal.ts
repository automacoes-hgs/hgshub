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
  | "Quase Campeões"
  | "Potencial de Lealdade"
  | "Novos Clientes"
  | "Em Risco (Alto Valor)"
  | "Em Risco"
  | "Perdidos Fiéis"
  | "Perdidos"
  | "Precisam de Atenção"

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

// ── Regras de segmentação — avaliadas em ordem de prioridade ─────────────────
// Baseadas em R, F, V individuais (1–5) e score total (3–15)

function classificar(r: number, f: number, v: number, score: number): PortalRfvSegment {
  // 1. Campeões — top 20% nas três dimensões simultaneamente
  if (r === 5 && f === 5 && v === 5)          return "Campeões"

  // 2. Clientes Fiéis — top 40% nas três
  if (r >= 4 && f >= 4 && v >= 4)             return "Clientes Fiéis"

  // 3. Quase Campeões — recentes + pontuação total alta
  if (r >= 4 && score >= 12)                  return "Quase Campeões"

  // 4. Potencial de Lealdade — engajados, ainda não consistentes
  if (r >= 3 && f >= 3 && score >= 9)         return "Potencial de Lealdade"

  // 5. Novos Clientes — recentes mas pouca frequência
  if (r >= 4 && f <= 2)                       return "Novos Clientes"

  // 6. Em Risco (Alto Valor) — eram ótimos, sumiram
  if (r <= 2 && f >= 4 && v >= 4)             return "Em Risco (Alto Valor)"

  // 7. Em Risco — médios/bons clientes sumindo
  if (r <= 2 && f >= 3)                       return "Em Risco"

  // 8. Perdidos Fiéis — eram frequentes, faz muito tempo
  if (r === 1 && f >= 4)                      return "Perdidos Fiéis"

  // 9. Perdidos — nunca muito engajados e sumiram
  if (r === 1 && score <= 5)                  return "Perdidos"

  // 10. Precisam de Atenção — todos os demais
  return "Precisam de Atenção"
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
      segment:          classificar(r, f, v, score),
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
  "Campeões":              { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", card: "bg-emerald-500", hex: "#27AE60" },
  "Clientes Fiéis":        { bg: "bg-green-50",    text: "text-green-700",   border: "border-green-200",   dot: "bg-green-500",   card: "bg-green-500",   hex: "#2ECC71" },
  "Quase Campeões":        { bg: "bg-teal-50",     text: "text-teal-700",    border: "border-teal-200",    dot: "bg-teal-500",    card: "bg-teal-500",    hex: "#1ABC9C" },
  "Potencial de Lealdade": { bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-200",     dot: "bg-sky-500",     card: "bg-sky-500",     hex: "#5DADE2" },
  "Novos Clientes":        { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500",    card: "bg-blue-500",    hex: "#3498DB" },
  "Em Risco (Alto Valor)": { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     card: "bg-red-500",     hex: "#E74C3C" },
  "Em Risco":              { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500",  card: "bg-orange-500",  hex: "#F39C12" },
  "Perdidos Fiéis":        { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500",   card: "bg-amber-500",   hex: "#E67E22" },
  "Perdidos":              { bg: "bg-zinc-100",    text: "text-zinc-500",    border: "border-zinc-200",    dot: "bg-zinc-400",    card: "bg-zinc-300",    hex: "#BDC3C7" },
  "Precisam de Atenção":   { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400",   card: "bg-slate-400",   hex: "#7F8C8D" },
}

export const PORTAL_SEGMENT_ORDER: PortalRfvSegment[] = [
  "Campeões",
  "Clientes Fiéis",
  "Quase Campeões",
  "Potencial de Lealdade",
  "Novos Clientes",
  "Em Risco (Alto Valor)",
  "Em Risco",
  "Perdidos Fiéis",
  "Perdidos",
  "Precisam de Atenção",
]

// ── Grid da Matriz RFV (visual — segmentos por prioridade) ───────────────────
// 2 linhas × 5 colunas para acomodar os 10 segmentos

export const MATRIX_GRID: {
  label: string
  seg: PortalRfvSegment
  matrixBg: string
  matrixText: string
}[][] = [
  [
    { label: "Campeões",              seg: "Campeões",              matrixBg: "#27AE60", matrixText: "#fff" },
    { label: "Clientes Fiéis",        seg: "Clientes Fiéis",        matrixBg: "#2ECC71", matrixText: "#fff" },
    { label: "Quase Campeões",        seg: "Quase Campeões",        matrixBg: "#1ABC9C", matrixText: "#fff" },
    { label: "Potencial de Lealdade", seg: "Potencial de Lealdade", matrixBg: "#5DADE2", matrixText: "#fff" },
    { label: "Novos Clientes",        seg: "Novos Clientes",        matrixBg: "#3498DB", matrixText: "#fff" },
  ],
  [
    { label: "Em Risco (Alto Valor)", seg: "Em Risco (Alto Valor)", matrixBg: "#E74C3C", matrixText: "#fff" },
    { label: "Em Risco",              seg: "Em Risco",              matrixBg: "#F39C12", matrixText: "#fff" },
    { label: "Perdidos Fiéis",        seg: "Perdidos Fiéis",        matrixBg: "#E67E22", matrixText: "#fff" },
    { label: "Perdidos",              seg: "Perdidos",              matrixBg: "#BDC3C7", matrixText: "#555" },
    { label: "Precisam de Atenção",   seg: "Precisam de Atenção",   matrixBg: "#7F8C8D", matrixText: "#fff" },
  ],
]

// ── Cores para gráfico donut ─────────────────────────────────────────────────

export const SEGMENT_CHART_COLORS: Record<PortalRfvSegment, string> = {
  "Campeões":              "#27AE60",
  "Clientes Fiéis":        "#2ECC71",
  "Quase Campeões":        "#1ABC9C",
  "Potencial de Lealdade": "#5DADE2",
  "Novos Clientes":        "#3498DB",
  "Em Risco (Alto Valor)": "#E74C3C",
  "Em Risco":              "#F39C12",
  "Perdidos Fiéis":        "#E67E22",
  "Perdidos":              "#BDC3C7",
  "Precisam de Atenção":   "#7F8C8D",
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
