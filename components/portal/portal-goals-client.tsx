"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Target, Pencil, Trash2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Empty } from "@/components/ui/empty"

interface Goal {
  id: string
  title: string
  description?: string | null
  category: string
  target_value: number
  current_value: number
  unit: string
  period_start: string
  period_end: string
  status: string
}

interface Props { goals: Goal[]; ownerId: string }

const EMPTY_FORM = {
  title: "", description: "", category: "geral",
  target_value: "", current_value: "0", unit: "%",
  period_start: "", period_end: "",
}

export function PortalGoalsClient({ goals: initial, ownerId }: Props) {
  const [goals, setGoals] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setOpen(true) }
  function openEdit(g: Goal) {
    setEditing(g)
    setForm({
      title: g.title, description: g.description ?? "", category: g.category,
      target_value: String(g.target_value), current_value: String(g.current_value),
      unit: g.unit, period_start: g.period_start, period_end: g.period_end,
    })
    setOpen(true)
  }

  async function handleSave() {
    const payload = {
      owner_id: ownerId,
      title: form.title,
      description: form.description || null,
      category: form.category,
      target_value: Number(form.target_value),
      current_value: Number(form.current_value),
      unit: form.unit,
      period_start: form.period_start,
      period_end: form.period_end,
    }
    let error
    if (editing) {
      const res = await supabase.from("client_goals").update(payload).eq("id", editing.id)
      error = res.error
    } else {
      const res = await supabase.from("client_goals").insert(payload)
      error = res.error
    }
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: editing ? "Meta atualizada" : "Meta criada com sucesso" })
      setOpen(false)
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("client_goals").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Meta removida" })
      startTransition(() => router.refresh())
    }
  }

  const active = goals.filter((g) => g.status === "active")
  const done = goals.filter((g) => g.status !== "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Metas e Resultados</h2>
          <p className="text-sm text-muted-foreground mt-1">Defina e acompanhe as metas da sua operação.</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Empty title="Nenhuma meta cadastrada" description="Crie sua primeira meta para começar a acompanhar os resultados." />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Em andamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Concluídas / Canceladas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {done.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle>
            <DialogDescription>Preencha os dados para {editing ? "atualizar a" : "criar uma nova"} meta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Aumentar receita recorrente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor alvo</Label>
                <Input type="number" value={form.target_value} onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Valor atual</Label>
                <Input type="number" value={form.current_value} onChange={(e) => setForm((f) => ({ ...f, current_value: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="%, R$, un..." />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="geral, vendas..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || !form.title || !form.target_value || !form.period_start || !form.period_end}>
              {editing ? "Salvar" : "Criar meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: (g: Goal) => void; onDelete: (id: string) => void }) {
  const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0
  const isOk = pct >= 80
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

  return (
    <Card className="border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{goal.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{fmt(goal.period_start)} → {fmt(goal.period_end)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(goal)} className="p-1.5 rounded hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{goal.current_value} / {goal.target_value} {goal.unit}</span>
          <span className={cn("text-xs font-bold", isOk ? "text-green-600" : "text-destructive")}>{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", isOk ? "bg-green-500" : "bg-destructive")} style={{ width: `${pct}%` }} />
        </div>
        {goal.status !== "active" && (
          <Badge className="mt-2 text-[10px]" variant="secondary">{goal.status === "completed" ? "Concluída" : "Cancelada"}</Badge>
        )}
      </CardContent>
    </Card>
  )
}
