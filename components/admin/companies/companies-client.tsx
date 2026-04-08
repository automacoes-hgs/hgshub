"use client"

import { useState, useTransition } from "react"
import {
  Plus, Pencil, Trash2, Target, Building2, ChevronRight,
  ArrowLeft, TrendingUp, TrendingDown, Minus, Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  createCompany, updateCompany, deleteCompany,
  createGoal, updateGoal, deleteGoal, getGoalsByCompany,
  type CompanyFormData, type GoalFormData,
} from "@/app/admin/companies/actions"

// ── Tipos ──────────────────────────────────────────────────────────────────

type Company = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  company_goals: { count: number }[]
}

type Goal = {
  id: string
  company_id: string
  unidade: string | null
  tipo_receita: "MRR" | "MRU" | null
  ano: number
  mes: number | null
  categoria: string | null
  valor_meta: number
  resultado: number
  meta_clientes: number | null
  ticket_medio: number | null
  observacoes: string | null
}

// ── Constantes ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const NOW = new Date()
const YEARS = Array.from({ length: 5 }, (_, i) => NOW.getFullYear() - 1 + i)

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

function goalProgress(meta: number, resultado: number) {
  if (meta === 0) return 0
  return Math.round((resultado / meta) * 100)
}

function emptyCompanyForm(): CompanyFormData {
  return { name: "", slug: "", description: "" }
}

function emptyGoalForm(companyId: string): GoalFormData {
  return {
    company_id: companyId,
    unidade: "",
    tipo_receita: null,
    ano: NOW.getFullYear(),
    mes: NOW.getMonth() + 1,
    categoria: "",
    valor_meta: 0,
    resultado: 0,
    meta_clientes: null,
    ticket_medio: null,
    observacoes: "",
  }
}

// ── Componente Principal ───────────────────────────────────────────────────

interface CompaniesClientProps {
  initialCompanies: Company[]
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // ── Estado da lista de empresas
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)

  // ── Vista: "list" | empresa selecionada
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(false)

  // ── Modais empresa
  const [companyModal, setCompanyModal] = useState(false)
  const [companyForm, setCompanyForm] = useState<CompanyFormData>(emptyCompanyForm())
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null)
  const [savingCompany, setSavingCompany] = useState(false)

  // ── Modais meta
  const [goalModal, setGoalModal] = useState(false)
  const [goalForm, setGoalForm] = useState<GoalFormData>(emptyGoalForm(""))
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [savingGoal, setSavingGoal] = useState(false)

  // ── Confirmar deleção
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null)
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Navegação para empresa ─────────────────────────────────────────────

  async function openCompanyView(company: Company) {
    setSelectedCompany(company)
    setLoadingGoals(true)
    const result = await getGoalsByCompany(company.id)
    setLoadingGoals(false)
    if (result.error || !result.data) {
      toast({ title: "Erro ao carregar metas", description: result.error ?? "", variant: "destructive" })
      return
    }
    setGoals(result.data as Goal[])
  }

  function backToList() {
    setSelectedCompany(null)
    setGoals([])
  }

  // ── CRUD Empresa ───────────────────────────────────────────────────────

  function openNewCompany() {
    setEditingCompanyId(null)
    setCompanyForm(emptyCompanyForm())
    setCompanyModal(true)
  }

  function openEditCompany(c: Company, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingCompanyId(c.id)
    setCompanyForm({ name: c.name, slug: c.slug, description: c.description ?? "" })
    setCompanyModal(true)
  }

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    setCompanyForm((f) => ({ ...f, name, ...(editingCompanyId ? {} : { slug }) }))
  }

  async function handleSaveCompany() {
    if (!companyForm.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" })
      return
    }
    setSavingCompany(true)
    const result = editingCompanyId
      ? await updateCompany(editingCompanyId, companyForm)
      : await createCompany(companyForm)
    setSavingCompany(false)
    if (result.error) {
      toast({ title: "Erro ao salvar", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: editingCompanyId ? "Empresa atualizada" : "Empresa criada" })
    setCompanyModal(false)
    startTransition(() => { window.location.reload() })
  }

  async function handleDeleteCompany() {
    if (!deleteCompanyId) return
    setDeleting(true)
    const result = await deleteCompany(deleteCompanyId)
    setDeleting(false)
    if (result.error) {
      toast({ title: "Erro ao excluir", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Empresa excluída" })
      setCompanies((prev) => prev.filter((c) => c.id !== deleteCompanyId))
      if (selectedCompany?.id === deleteCompanyId) backToList()
    }
    setDeleteCompanyId(null)
  }

  // ── CRUD Meta ──────────────────────────────────────────────────────────

  function openNewGoal() {
    if (!selectedCompany) return
    setEditingGoalId(null)
    setGoalForm(emptyGoalForm(selectedCompany.id))
    setGoalModal(true)
  }

  function openEditGoal(g: Goal) {
    setEditingGoalId(g.id)
    setGoalForm({
      company_id: g.company_id,
      unidade: g.unidade ?? "",
      tipo_receita: g.tipo_receita ?? null,
      ano: g.ano,
      mes: g.mes ?? null,
      categoria: g.categoria ?? "",
      valor_meta: g.valor_meta,
      resultado: g.resultado,
      meta_clientes: g.meta_clientes,
      ticket_medio: g.ticket_medio,
      observacoes: g.observacoes ?? "",
    })
    setGoalModal(true)
  }

  async function handleSaveGoal() {
    if (!goalForm.valor_meta && goalForm.valor_meta !== 0) {
      toast({ title: "Valor da meta obrigatório", variant: "destructive" })
      return
    }
    setSavingGoal(true)
    const result = editingGoalId
      ? await updateGoal(editingGoalId, { ...goalForm })
      : await createGoal(goalForm)
    setSavingGoal(false)
    if (result.error) {
      toast({ title: "Erro ao salvar meta", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: editingGoalId ? "Meta atualizada" : "Meta criada" })
    setGoalModal(false)
    // Recarregar metas da empresa
    if (selectedCompany) {
      const updated = await getGoalsByCompany(selectedCompany.id)
      if (updated.data) setGoals(updated.data as Goal[])
    }
  }

  async function handleDeleteGoal() {
    if (!deleteGoalId) return
    setDeleting(true)
    const result = await deleteGoal(deleteGoalId)
    setDeleting(false)
    if (result.error) {
      toast({ title: "Erro ao excluir meta", description: result.error, variant: "destructive" })
    } else {
      toast({ title: "Meta excluída" })
      setGoals((prev) => prev.filter((g) => g.id !== deleteGoalId))
    }
    setDeleteGoalId(null)
  }

  // ── Exportar CSV ───────────────────────────────────────────────────────

  function exportCSV() {
    const header = [
      "unidade", "tipo_receita", "ano", "mes", "categoria",
      "valor_meta", "resultado", "meta_clientes", "ticket_medio", "observacoes",
    ]
    const rows = goals.map((g) => [
      g.unidade ?? "", g.tipo_receita ?? "", g.ano, g.mes ?? "",
      g.categoria ?? "", g.valor_meta, g.resultado,
      g.meta_clientes ?? "", g.ticket_medio ?? "", g.observacoes ?? "",
    ])
    const csv = [header, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `metas_${selectedCompany?.slug ?? "empresa"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportTemplateCSV() {
    const header = [
      "unidade", "tipo_receita", "ano", "mes", "categoria",
      "valor_meta", "resultado", "meta_clientes", "ticket_medio", "observacoes",
    ]
    const example = [
      ["Filial SP", "MRR", "2026", "1", "Assessoria", "50000", "42000", "10", "5000", "Meta Q1"],
    ]
    const csv = [header, ...example].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "modelo_metas.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Render: Vista de Empresa ───────────────────────────────────────────

  if (selectedCompany) {
    const totalMeta = goals.reduce((s, g) => s + g.valor_meta, 0)
    const totalResultado = goals.reduce((s, g) => s + g.resultado, 0)
    const overallPct = goalProgress(totalMeta, totalResultado)

    return (
      <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={backToList}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">{selectedCompany.name}</h1>
              {selectedCompany.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{selectedCompany.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportTemplateCSV} className="gap-2">
              <Download className="h-4 w-4" /> Modelo CSV
            </Button>
            {goals.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                <Download className="h-4 w-4" /> Exportar Metas
              </Button>
            )}
            <Button size="sm" onClick={openNewGoal} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Meta
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Meta", value: fmtBRL(totalMeta), sub: `${goals.length} registro${goals.length !== 1 ? "s" : ""}` },
              { label: "Total Resultado", value: fmtBRL(totalResultado), sub: overallPct >= 100 ? "Meta atingida" : `${overallPct}% da meta` },
              { label: "Progresso Geral", value: `${overallPct}%`, sub: overallPct >= 100 ? "Acima da meta" : overallPct >= 80 ? "Quase lá" : "Abaixo da meta" },
            ].map(({ label, value, sub }) => (
              <Card key={label} className="border-border bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Metas */}
        {loadingGoals ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Carregando metas...</div>
        ) : goals.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <Target className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma meta cadastrada.</p>
              <Button size="sm" onClick={openNewGoal} className="gap-2 mt-1">
                <Plus className="h-4 w-4" /> Criar primeira meta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Período</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Unidade</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Categoria</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Meta</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Resultado</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Progresso</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((g) => {
                      const pct = goalProgress(g.valor_meta, g.resultado)
                      const isOver = pct >= 100
                      const isGood = pct >= 80
                      return (
                        <tr key={g.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {g.mes ? `${MONTH_NAMES[g.mes - 1]} ${g.ano}` : String(g.ano)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{g.unidade || "—"}</td>
                          <td className="px-4 py-3">
                            {g.tipo_receita ? (
                              <Badge variant="outline" className="text-xs">{g.tipo_receita}</Badge>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{g.categoria || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtBRL(g.valor_meta)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmtBRL(g.resultado)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                {isOver ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                ) : isGood ? (
                                  <Minus className="h-3.5 w-3.5 text-amber-500" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span className={cn("text-xs font-bold",
                                  isOver ? "text-emerald-600" : isGood ? "text-amber-500" : "text-red-500"
                                )}>{pct}%</span>
                              </div>
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all",
                                    isOver ? "bg-emerald-500" : isGood ? "bg-amber-400" : "bg-red-400"
                                  )}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditGoal(g)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setDeleteGoalId(g.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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

      {/* ── Diálogos (renderizados quando em vista de empresa) ─────────────── */}
      <Dialog open={goalModal} onOpenChange={setGoalModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            <DialogDescription>
              Configure os valores de meta e resultado para o período selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Ano */}
            <div className="flex flex-col gap-1.5">
              <Label>Ano *</Label>
              <Select
                value={String(goalForm.ano)}
                onValueChange={(v) => setGoalForm((f) => ({ ...f, ano: Number(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Mês */}
            <div className="flex flex-col gap-1.5">
              <Label>Mês (opcional)</Label>
              <Select
                value={goalForm.mes ? String(goalForm.mes) : "all"}
                onValueChange={(v) => setGoalForm((f) => ({ ...f, mes: v === "all" ? null : Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos os meses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses (anual)</SelectItem>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Unidade */}
            <div className="flex flex-col gap-1.5">
              <Label>Unidade (filial)</Label>
              <Input
                value={goalForm.unidade ?? ""}
                onChange={(e) => setGoalForm((f) => ({ ...f, unidade: e.target.value }))}
                placeholder="Ex: SP, RJ, Matriz..."
              />
            </div>

            {/* Tipo de Receita */}
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de Receita</Label>
              <Select
                value={goalForm.tipo_receita ?? "none"}
                onValueChange={(v) => setGoalForm((f) => ({ ...f, tipo_receita: v === "none" ? null : v as "MRR" | "MRU" }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  <SelectItem value="MRR">MRR — Receita Recorrente Mensal</SelectItem>
                  <SelectItem value="MRU">MRU — Receita Única Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Categoria (produto/serviço)</Label>
              <Input
                value={goalForm.categoria ?? ""}
                onChange={(e) => setGoalForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Ex: Assessoria, BPO RH, Treinamento..."
              />
            </div>

            {/* Valor Meta */}
            <div className="flex flex-col gap-1.5">
              <Label>Valor Meta (R$) *</Label>
              <Input
                type="number"
                value={goalForm.valor_meta}
                onChange={(e) => setGoalForm((f) => ({ ...f, valor_meta: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>

            {/* Resultado */}
            <div className="flex flex-col gap-1.5">
              <Label>Resultado até agora (R$)</Label>
              <Input
                type="number"
                value={goalForm.resultado}
                onChange={(e) => setGoalForm((f) => ({ ...f, resultado: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>

            {/* Meta Clientes */}
            <div className="flex flex-col gap-1.5">
              <Label>Meta de Clientes (opcional)</Label>
              <Input
                type="number"
                value={goalForm.meta_clientes ?? ""}
                onChange={(e) => setGoalForm((f) => ({ ...f, meta_clientes: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Quantidade de clientes"
              />
            </div>

            {/* Ticket Médio */}
            <div className="flex flex-col gap-1.5">
              <Label>Ticket Médio (R$, opcional)</Label>
              <Input
                type="number"
                value={goalForm.ticket_medio ?? ""}
                onChange={(e) => setGoalForm((f) => ({ ...f, ticket_medio: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Valor médio por cliente"
              />
            </div>

            {/* Observações */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea
                value={goalForm.observacoes ?? ""}
                onChange={(e) => setGoalForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Anotações importantes sobre esta meta..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal ? "Salvando..." : editingGoalId ? "Salvar alterações" : "Criar meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmação de Deleção de Meta ──────────────────────────── */}
      <Dialog open={!!deleteGoalId} onOpenChange={(open) => { if (!open) setDeleteGoalId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir meta</DialogTitle>
            <DialogDescription>Esta ação é irreversível.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGoalId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteGoal} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  // ── Render: Lista de Empresas ──────────────────────────────────────────

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie empresas e suas metas financeiras
          </p>
        </div>
        <Button onClick={openNewCompany} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-20 flex flex-col items-center gap-3 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Nenhuma empresa cadastrada.</p>
            <Button onClick={openNewCompany} className="gap-2 mt-1">
              <Plus className="h-4 w-4" /> Criar primeira empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.map((c) => {
            const goalsCount = c.company_goals?.[0]?.count ?? 0
            return (
              <Card
                key={c.id}
                className="border-border bg-card cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
                onClick={() => openCompanyView(c)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold text-foreground truncate">{c.name}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate">{c.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditCompany(c, e)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteCompanyId(c.id) }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between">
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{c.description}</p>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Target className="h-3 w-3" />
                      {goalsCount} {goalsCount === 1 ? "meta" : "metas"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Modal: Empresa ────────────────────────────────────────────────── */}
      <Dialog open={companyModal} onOpenChange={setCompanyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCompanyId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              Preencha as informações da empresa. O slug é gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nome da empresa *</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Geovan Consultoria"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug (identificador único)</Label>
              <Input
                value={companyForm.slug}
                onChange={(e) => setCompanyForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="ex: geovan-consultoria"
              />
              <p className="text-xs text-muted-foreground">Apenas letras minúsculas, números e hífens.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={companyForm.description ?? ""}
                onChange={(e) => setCompanyForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descrição da empresa..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveCompany} disabled={savingCompany}>
              {savingCompany ? "Salvando..." : editingCompanyId ? "Salvar alterações" : "Criar empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
