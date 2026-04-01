"use client"

import { useState, useTransition, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp, Users, DollarSign, Star, AlertTriangle, UserCheck,
  Plus, Pencil, Trash2, Search, Package, FileBarChart2,
  Target, BarChart3, PieChartIcon, ArrowUpRight, Upload,
  ChevronLeft, ChevronRight
} from "lucide-react"
import { PortalRfvImport } from "./portal-rfv-import"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import {
  computePortalRfv, PORTAL_SEGMENT_COLORS, PORTAL_SEGMENT_ORDER,
  SEGMENT_CHART_COLORS, MATRIX_GRID, fmtValue, PAYMENT_LABELS,
  type PortalRfvEntry, type PortalRfvSegment,
} from "@/lib/rfv-portal"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────
export type Product = {
  id: string; owner_id: string; name: string; description?: string | null
  category?: string | null; price: number; is_active: boolean; created_at: string
}

interface Props {
  ownerId: string
  entries: PortalRfvEntry[]
  products: Product[]
}

// ─── Formulário de entrada ───────────────────────────────────────────────────
type EntryForm = {
  customer_name: string; product_id: string; product_name: string
  value: string; payment_method: string; purchase_date: string; notes: string
}

const EMPTY_ENTRY: EntryForm = {
  customer_name: "", product_id: "", product_name: "",
  value: "", payment_method: "outros", purchase_date: new Date().toISOString().slice(0, 10), notes: "",
}

// ─── Formulário de produto ───────────────────────────────────────────────────
type ProductForm = { name: string; description: string; category: string; price: string }
const EMPTY_PRODUCT: ProductForm = { name: "", description: "", category: "", price: "" }

// ─── Componente principal ────────────────────────────────────────────────────
export function PortalRfvClient({ ownerId, entries: initialEntries, products: initialProducts }: Props) {
  const [activeTab, setActiveTab] = useState<"clientes" | "produtos" | "relatorio">("relatorio")
  const [entries, setEntries] = useState(initialEntries)
  const [products, setProducts] = useState(initialProducts)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Clientes tab state
  const [search, setSearch] = useState("")
  const [entryModal, setEntryModal] = useState(false)
  const [editEntry, setEditEntry] = useState<PortalRfvEntry | null>(null)
  const [entryForm, setEntryForm] = useState<EntryForm>(EMPTY_ENTRY)
  const [entryLoading, setEntryLoading] = useState(false)

  // Produtos tab state
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT)
  const [productLoading, setProductLoading] = useState(false)

  // Seleção múltipla para exclusão em massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      return new Set([...prev, ...ids])
    })
  }
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Remover ${selectedIds.size} entrada(s) selecionada(s)?`)) return
    setBulkDeleting(true)
    const ids = [...selectedIds]

    // Supabase rejeita .in() com muitos IDs via URL — fazemos em lotes de 50
    const BATCH = 50
    for (let i = 0; i < ids.length; i += BATCH) {
      const chunk = ids.slice(i, i + BATCH)
      const { error } = await supabase
        .from("client_rfv_entries")
        .delete()
        .in("id", chunk)
        .eq("owner_id", ownerId)
      if (error) {
        toast({ title: "Erro ao remover", description: error.message, variant: "destructive" })
        setBulkDeleting(false)
        return
      }
    }

    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)))
    setSelectedIds(new Set())
    setBulkDeleting(false)
    toast({ title: `${ids.length} entrada(s) removida(s)` })
    startTransition(() => router.refresh())
  }

  // Importação
  const [importModal, setImportModal] = useState(false)
  function handleImported(newEntries: typeof entries, newProducts: typeof products) {
    setEntries((prev) => [...newEntries, ...prev])
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id))
      return [...prev, ...newProducts.filter((p) => !existingIds.has(p.id))]
    })
    startTransition(() => router.refresh())
  }

  // ── RFV computed ────────────────────────────────────────────────────────────
  const rfvClients = useMemo(() => computePortalRfv(entries), [entries])

  const totalRevenue = useMemo(() => entries.reduce((s, e) => s + Number(e.value), 0), [entries])
  const avgTicket = rfvClients.length ? totalRevenue / rfvClients.length : 0
  const champions = rfvClients.filter((c) => c.segment === "Campeões").length
  const atRisk = rfvClients.filter((c) =>
    c.segment === "Em Risco" || c.segment === "Hibernando" ||
    c.segment === "Não Perder" || c.segment === "Prestes a Hibernar" || c.segment === "Perdidos"
  ).length

  // Dados para gráficos
  const segmentCounts = useMemo(() => {
    const map: Partial<Record<PortalRfvSegment, number>> = {}
    for (const c of rfvClients) map[c.segment] = (map[c.segment] ?? 0) + 1
    return PORTAL_SEGMENT_ORDER.filter((s) => map[s]).map((s) => ({
      name: s, value: map[s]!, color: SEGMENT_CHART_COLORS[s],
    }))
  }, [rfvClients])

  const segmentRevenue = useMemo(() => {
    const map: Partial<Record<PortalRfvSegment, number>> = {}
    for (const c of rfvClients) map[c.segment] = (map[c.segment] ?? 0) + c.totalValue
    return PORTAL_SEGMENT_ORDER.filter((s) => map[s]).map((s) => ({
      name: s, value: map[s]!, color: SEGMENT_CHART_COLORS[s],
    }))
  }, [rfvClients])

  const productRevenue = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) map[e.product_name] = (map[e.product_name] ?? 0) + Number(e.value)
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, value }))
  }, [entries])

  const matrixData = useMemo(() => {
    const map: Partial<Record<PortalRfvSegment, number>> = {}
    for (const c of rfvClients) map[c.segment] = (map[c.segment] ?? 0) + 1
    return map
  }, [rfvClients])

  // ── Entries CRUD ─────────────────────────────────────────────────────────────
  function openEntryCreate() {
    setEditEntry(null); setEntryForm(EMPTY_ENTRY); setEntryModal(true)
  }
  function openEntryEdit(e: PortalRfvEntry) {
    setEditEntry(e)
    setEntryForm({
      customer_name: e.customer_name, product_id: e.product_id ?? "",
      product_name: e.product_name, value: String(e.value),
      payment_method: e.payment_method, purchase_date: e.purchase_date, notes: e.notes ?? "",
    })
    setEntryModal(true)
  }
  function handleProductSelect(productId: string) {
    const p = products.find((p) => p.id === productId)
    if (p) setEntryForm((f) => ({ ...f, product_id: p.id, product_name: p.name, value: String(p.price) }))
    else setEntryForm((f) => ({ ...f, product_id: "", product_name: "" }))
  }
  async function handleEntrySave() {
    if (!entryForm.customer_name || !entryForm.product_name || !entryForm.purchase_date) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return
    }
    setEntryLoading(true)
    const payload = {
      owner_id: ownerId,
      customer_name: entryForm.customer_name.trim(),
      product_id: entryForm.product_id || null,
      product_name: entryForm.product_name.trim(),
      value: Number(entryForm.value) || 0,
      payment_method: entryForm.payment_method,
      purchase_date: entryForm.purchase_date,
      notes: entryForm.notes || null,
    }
    if (editEntry) {
      const { error } = await supabase.from("client_rfv_entries").update(payload).eq("id", editEntry.id)
      if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); setEntryLoading(false); return }
      setEntries((prev) => prev.map((e) => e.id === editEntry.id ? { ...e, ...payload } : e))
      toast({ title: "Entrada atualizada" })
    } else {
      const { data, error } = await supabase.from("client_rfv_entries").insert(payload).select().single()
      if (error) { toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }); setEntryLoading(false); return }
      setEntries((prev) => [data, ...prev])
      toast({ title: "Entrada cadastrada" })
    }
    setEntryLoading(false); setEntryModal(false)
    startTransition(() => router.refresh())
  }
  async function handleEntryDelete(id: string) {
    if (!confirm("Remover esta entrada?")) return
    const { error } = await supabase.from("client_rfv_entries").delete().eq("id", id)
    if (error) { toast({ title: "Erro ao remover", description: error.message, variant: "destructive" }); return }
    setEntries((prev) => prev.filter((e) => e.id !== id))
    toast({ title: "Entrada removida" })
  }

  // ── Products CRUD ────────────────────────────────────────────────────────────
  function openProductCreate() { setEditProduct(null); setProductForm(EMPTY_PRODUCT); setProductModal(true) }
  function openProductEdit(p: Product) {
    setEditProduct(p)
    setProductForm({ name: p.name, description: p.description ?? "", category: p.category ?? "", price: String(p.price) })
    setProductModal(true)
  }
  async function handleProductSave() {
    if (!productForm.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return }
    setProductLoading(true)
    const payload = {
      owner_id: ownerId, name: productForm.name.trim(),
      description: productForm.description || null, category: productForm.category || null,
      price: Number(productForm.price) || 0,
    }
    if (editProduct) {
      const { error } = await supabase.from("client_products").update(payload).eq("id", editProduct.id)
      if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); setProductLoading(false); return }
      setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...payload } : p))
      toast({ title: "Produto atualizado" })
    } else {
      const { data, error } = await supabase.from("client_products").insert(payload).select().single()
      if (error) { toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }); setProductLoading(false); return }
      setProducts((prev) => [data, ...prev])
      toast({ title: "Produto cadastrado" })
    }
    setProductLoading(false); setProductModal(false)
  }
  async function handleProductDelete(id: string) {
    if (!confirm("Remover este produto?")) return
    const { error } = await supabase.from("client_products").delete().eq("id", id)
    if (error) { toast({ title: "Erro ao remover", description: error.message, variant: "destructive" }); return }
    setProducts((prev) => prev.filter((p) => p.id !== id))
    toast({ title: "Produto removido" })
  }

  // ── Paginação da tabela Clientes por Segmento ────────────────────────────────
  const SEGMENT_PAGE_SIZE = 15
  const [segmentPage, setSegmentPage] = useState(1)

  const sortedRfvClients = useMemo(
    () => [...rfvClients].sort((a, b) => b.score - a.score),
    [rfvClients]
  )
  const segmentTotalPages = Math.max(1, Math.ceil(sortedRfvClients.length / SEGMENT_PAGE_SIZE))
  const paginatedRfvClients = useMemo(
    () => sortedRfvClients.slice((segmentPage - 1) * SEGMENT_PAGE_SIZE, segmentPage * SEGMENT_PAGE_SIZE),
    [sortedRfvClients, segmentPage]
  )

  const handleSegmentPageChange = useCallback((page: number) => {
    setSegmentPage(page)
  }, [])

  // ── Filtered entries ─────────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    if (!search) return entries
    const q = search.toLowerCase()
    return entries.filter((e) =>
      e.customer_name.toLowerCase().includes(q) || e.product_name.toLowerCase().includes(q)
    )
  }, [entries, search])

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "relatorio" as const, label: "Relatório", icon: BarChart3 },
    { key: "clientes" as const, label: "Clientes", icon: Users },
    { key: "produtos" as const, label: "Produtos / Serviços", icon: Package },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Análise de RFV</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {rfvClients.length} clientes · {entries.length} transações
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RELATÓRIO ───────────────────────────────────────────────────��─────── */}
      {activeTab === "relatorio" && (
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] rounded-xl border border-border bg-card text-center gap-3">
              <FileBarChart2 className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma transaç��o cadastrada ainda.</p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("clientes")}>
                Cadastrar transação
              </Button>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Receita Total", value: fmtValue(totalRevenue), sub: `${entries.length} transações`, icon: DollarSign, bg: "bg-blue-50", color: "text-blue-600" },
                  { label: "Total de Clientes", value: String(rfvClients.length), sub: "clientes únicos", icon: Users, bg: "bg-slate-50", color: "text-slate-600" },
                  { label: "Ticket Médio", value: fmtValue(avgTicket), sub: "por cliente", icon: TrendingUp, bg: "bg-slate-50", color: "text-slate-600" },
                  { label: "Campeões", value: String(champions), sub: "clientes top", icon: Star, bg: "bg-emerald-50", color: "text-emerald-600" },
                  { label: "Em Risco / Hibernando", value: String(atRisk), sub: `${rfvClients.length ? Math.round((atRisk / rfvClients.length) * 100) : 0}% da base`, icon: AlertTriangle, bg: "bg-red-50", color: "text-red-500" },
                  { label: "Potencial Upsell", value: String(rfvClients.filter((c) => ["Campeões","Clientes Fiéis","Potenciais"].includes(c.segment)).length), sub: "elegíveis", icon: ArrowUpRight, bg: "bg-violet-50", color: "text-violet-600" },
                  { label: "Clientes Ativos", value: `${rfvClients.length ? Math.round((rfvClients.filter((c) => c.recency === 3).length / rfvClients.length) * 100) : 0}%`, sub: `${rfvClients.filter((c) => c.recency === 3).length} clientes`, icon: UserCheck, bg: "bg-emerald-50", color: "text-emerald-600" },
                  { label: "Janela de Recompra", value: String(rfvClients.filter((c) => c.recency === 3 && c.frequency >= 2).length), sub: "prontos para renovar", icon: Target, bg: "bg-amber-50", color: "text-amber-600" },
                ].map((card) => (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-0.5">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg shrink-0", card.bg)}>
                      <card.icon className={cn("h-5 w-5", card.color)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráficos — linha 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut — Distribuição por segmento */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-accent" /> Distribuição por Segmento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={segmentCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                          {segmentCounts.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} clientes`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {segmentCounts.map((s) => (
                        <div key={s.name} className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                          <span className="text-[11px] text-muted-foreground">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bar horizontal — Receita por segmento */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-accent" /> Receita por Segmento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={segmentRevenue} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => fmtValue(v)} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip formatter={(v: number) => [fmtValue(v)]} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {segmentRevenue.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos — linha 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar vertical — Receita por produto */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-accent" /> Receita por Produto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={productRevenue} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                        <YAxis tickFormatter={(v) => fmtValue(v)} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [fmtValue(v)]} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Matriz RFV */}
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-accent" /> Matriz RFV
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex gap-2">
                      {/* Eixo Y label */}
                      <div className="flex items-center justify-center w-5 shrink-0">
                        <span className="text-[9px] font-medium text-muted-foreground [writing-mode:vertical-lr] rotate-180 text-center leading-none tracking-wide uppercase">
                          Frequência e valor
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        {/* Grid 3×3 com labels de FV à esquerda */}
                        {MATRIX_GRID.map((row, rowIdx) => {
                          const fvLabel = rowIdx === 0 ? "Alto" : rowIdx === 1 ? "Médio" : "Baixo"
                          return (
                            <div key={rowIdx} className="flex items-stretch gap-1">
                              {/* Label FV */}
                              <div className="flex items-center justify-center w-8 shrink-0">
                                <span className="text-[9px] font-semibold text-muted-foreground [writing-mode:vertical-lr] rotate-180 text-center leading-none">
                                  {fvLabel}
                                </span>
                              </div>
                              {/* Células */}
                              <div className="flex-1 grid grid-cols-3 gap-1">
                                {row.map((cell) => {
                                  const count = matrixData[cell.seg] ?? 0
                                  const pct = rfvClients.length
                                    ? Math.round((count / rfvClients.length) * 100)
                                    : 0
                                  const textColor = cell.matrixText === "#555" ? "#555" : "#fff"
                                  return (
                                    <div
                                      key={cell.seg}
                                      className="rounded-xl p-2.5 flex flex-col justify-between min-h-[72px]"
                                      style={{ backgroundColor: cell.matrixBg }}
                                    >
                                      <p
                                        className="text-[10px] font-semibold leading-tight"
                                        style={{ color: textColor, opacity: 0.9 }}
                                      >
                                        {cell.label}
                                      </p>
                                      <div>
                                        <p
                                          className="text-xl font-bold leading-none"
                                          style={{ color: textColor }}
                                        >
                                          {count}
                                        </p>
                                        <p
                                          className="text-[10px] font-medium mt-0.5"
                                          style={{ color: textColor, opacity: 0.7 }}
                                        >
                                          {pct}%
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}

                        {/* Eixo X labels das colunas */}
                        <div className="flex gap-1 mt-1">
                          <div className="w-8 shrink-0" />
                          <div className="flex-1 grid grid-cols-3 gap-1">
                            {["Antigo", "Médio", "Recente"].map((label) => (
                              <p key={label} className="text-[9px] font-semibold text-muted-foreground text-center uppercase tracking-wide">
                                {label}
                              </p>
                            ))}
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                          Recência (quão recentemente o cliente comprou)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de clientes RFV */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Clientes por Segmento</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {sortedRfvClients.length} clientes
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cliente</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Segmento</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Total</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">R</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">F</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">V</th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRfvClients.map((c) => {
                          const colors = PORTAL_SEGMENT_COLORS[c.segment]
                          return (
                            <tr key={c.customerName} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground">{c.customerName}</td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colors.bg, colors.text)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                                  {c.segment}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtValue(c.totalValue)}</td>
                              <td className="px-4 py-3 text-center text-muted-foreground">{c.recency}</td>
                              <td className="px-4 py-3 text-center text-muted-foreground">{c.frequency}</td>
                              <td className="px-4 py-3 text-center text-muted-foreground">{c.monetary}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn("font-bold", c.score >= 2.5 ? "text-emerald-600" : c.score >= 1.8 ? "text-amber-500" : "text-red-500")}>
                                  {c.score.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação */}
                  {segmentTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Página {segmentPage} de {segmentTotalPages} · {sortedRfvClients.length} clientes
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSegmentPageChange(segmentPage - 1)}
                          disabled={segmentPage === 1}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: segmentTotalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === segmentTotalPages || Math.abs(p - segmentPage) <= 1)
                          .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                            acc.push(p)
                            return acc
                          }, [])
                          .map((item, idx) =>
                            item === "..." ? (
                              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                            ) : (
                              <button
                                key={item}
                                onClick={() => handleSegmentPageChange(item as number)}
                                className={cn(
                                  "min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-colors",
                                  segmentPage === item
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                              >
                                {item}
                              </button>
                            )
                          )}
                        <button
                          onClick={() => handleSegmentPageChange(segmentPage + 1)}
                          disabled={segmentPage === segmentTotalPages}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Próxima página"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── CLIENTES ──────────────────────────────────────────────────────────── */}
      {activeTab === "clientes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente ou produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {bulkDeleting ? "Removendo..." : `Excluir ${selectedIds.size} selecionado(s)`}
                </Button>
              )}
              <Button variant="outline" onClick={() => setImportModal(true)} className="gap-2">
                <Upload className="h-4 w-4" /> Importar
              </Button>
              <Button onClick={openEntryCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Nova Transação
              </Button>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] rounded-xl border border-border bg-card text-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "Nenhum resultado encontrado." : "Nenhuma transação cadastrada."}
              </p>
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-border cursor-pointer accent-primary"
                            checked={filteredEntries.length > 0 && filteredEntries.every((e) => selectedIds.has(e.id))}
                            onChange={() => toggleSelectAll(filteredEntries.map((e) => e.id))}
                            aria-label="Selecionar todos"
                          />
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Produto/Serviço</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Pagamento</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Data</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((e) => {
                        const isSelected = selectedIds.has(e.id)
                        return (
                          <tr
                            key={e.id}
                            className={cn(
                              "border-b border-border/50 hover:bg-muted/30 transition-colors",
                              isSelected && "bg-primary/5"
                            )}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                className="rounded border-border cursor-pointer accent-primary"
                                checked={isSelected}
                                onChange={() => toggleSelect(e.id)}
                                aria-label={`Selecionar ${e.customer_name}`}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">{e.customer_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{e.product_name}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtValue(Number(e.value))}</td>
                            <td className="px-4 py-3 text-muted-foreground">{PAYMENT_LABELS[e.payment_method] ?? e.payment_method}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(e.purchase_date + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEntryEdit(e)} className="text-muted-foreground hover:text-foreground transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleEntryDelete(e.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── PRODUTOS / SERVIÇOS ───────────────────────────────────────────────── */}
      {activeTab === "produtos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openProductCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Produto / Serviço
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] rounded-xl border border-border bg-card text-center gap-3">
              <Package className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum produto cadastrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openProductEdit(p)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleProductDelete(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{p.description}</p>}
                    <p className="text-xl font-bold text-foreground">{fmtValue(Number(p.price))}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL IMPORTAÇÃO ──────────────────────────────────────────────────── */}
      <PortalRfvImport
        ownerId={ownerId}
        products={products}
        open={importModal}
        onClose={() => setImportModal(false)}
        onImported={handleImported}
      />

      {/* ── MODAL ENTRADA ─────────────────────────────────────────────────────── */}
      <Dialog open={entryModal} onOpenChange={setEntryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editEntry ? "Editar Transação" : "Nova Transação"}</DialogTitle>
            <DialogDescription>Registre a compra de um cliente vinculando a um produto ou serviço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome do cliente *</label>
              <Input className="mt-1" value={entryForm.customer_name} onChange={(e) => setEntryForm((f) => ({ ...f, customer_name: e.target.value }))} placeholder="Ex: João Silva" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Produto / Serviço *</label>
              <select
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={entryForm.product_id}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Selecione ou preencha manualmente</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtValue(Number(p.price))}</option>)}
              </select>
              {!entryForm.product_id && (
                <Input className="mt-2" value={entryForm.product_name} onChange={(e) => setEntryForm((f) => ({ ...f, product_name: e.target.value }))} placeholder="Nome do produto/serviço" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
                <Input className="mt-1" type="number" value={entryForm.value} onChange={(e) => setEntryForm((f) => ({ ...f, value: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data da compra *</label>
                <Input className="mt-1" type="date" value={entryForm.purchase_date} onChange={(e) => setEntryForm((f) => ({ ...f, purchase_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Forma de pagamento</label>
              <select
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={entryForm.payment_method}
                onChange={(e) => setEntryForm((f) => ({ ...f, payment_method: e.target.value }))}
              >
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Observações</label>
              <Input className="mt-1" value={entryForm.notes} onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryModal(false)}>Cancelar</Button>
            <Button onClick={handleEntrySave} disabled={entryLoading}>
              {entryLoading ? "Salvando..." : editEntry ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL PRODUTO ─────────────────────────────────────────────────────── */}
      <Dialog open={productModal} onOpenChange={setProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto / Serviço"}</DialogTitle>
            <DialogDescription>Adicione ao catálogo para usar rapidamente no cadastro de transações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input className="mt-1" value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Consultoria Mensal" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Input className="mt-1" value={productForm.category} onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: Serviço recorrente" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Input className="mt-1" value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição curta" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Preço (R$)</label>
              <Input className="mt-1" type="number" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModal(false)}>Cancelar</Button>
            <Button onClick={handleProductSave} disabled={productLoading}>
              {productLoading ? "Salvando..." : editProduct ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
