"use client"

import { useState } from "react"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { BdrMember, BdrGoal } from "@/lib/types/bdr"
import { MONTH_NAMES } from "@/lib/types/bdr"

interface BdrGoalsClientProps {
  members: BdrMember[]
  goals: BdrGoal[]
}

const GOAL_FIELDS = [
  { key: "attempts_goal",           label: "Tentativas" },
  { key: "attendances_goal",        label: "Atendimentos" },
  { key: "decision_makers_goal",    label: "Decisores" },
  { key: "qualifications_goal",     label: "Qualificações" },
  { key: "meetings_scheduled_goal", label: "Reuniões Agendadas" },
  { key: "meetings_done_goal",      label: "Reuniões Realizadas" },
  { key: "lead_time_goal",          label: "Lead Time (dias)" },
] as const

const NOW = new Date()
const YEARS = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1]

type FormData = {
  bdr_id: string
  year: string
  month: string
  attempts_goal: string
  attendances_goal: string
  decision_makers_goal: string
  qualifications_goal: string
  meetings_scheduled_goal: string
  meetings_done_goal: string
  lead_time_goal: string
}

function emptyForm(): FormData {
  return {
    bdr_id: "", year: String(NOW.getFullYear()), month: String(NOW.getMonth() + 1),
    attempts_goal: "", attendances_goal: "", decision_makers_goal: "",
    qualifications_goal: "", meetings_scheduled_goal: "", meetings_done_goal: "",
    lead_time_goal: "5",
  }
}

export function BdrGoalsClient({ members, goals: initialGoals }: BdrGoalsClientProps) {
  const [goals, setGoals] = useState<BdrGoal[]>(initialGoals)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))

  function openNew() { setForm(emptyForm()); setOpen(true) }
  function openEdit(g: BdrGoal) {
    setForm({
      bdr_id: g.bdr_id, year: String(g.year), month: String(g.month),
      attempts_goal: String(g.attempts_goal), attendances_goal: String(g.attendances_goal),
      decision_makers_goal: String(g.decision_makers_goal), qualifications_goal: String(g.qualifications_goal),
      meetings_scheduled_goal: String(g.meetings_scheduled_goal), meetings_done_goal: String(g.meetings_done_goal),
      lead_time_goal: String(g.lead_time_goal),
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.bdr_id) { toast({ title: "Selecione o BDR", variant: "destructive" }); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      bdr_id: form.bdr_id, year: Number(form.year), month: Number(form.month),
      attempts_goal: Number(form.attempts_goal) || 0,
      attendances_goal: Number(form.attendances_goal) || 0,
      decision_makers_goal: Number(form.decision_makers_goal) || 0,
      qualifications_goal: Number(form.qualifications_goal) || 0,
      meetings_scheduled_goal: Number(form.meetings_scheduled_goal) || 0,
      meetings_done_goal: Number(form.meetings_done_goal) || 0,
      lead_time_goal: Number(form.lead_time_goal) || 5,
    }
    const { data, error } = await supabase
      .from("bdr_goals")
      .upsert(payload, { onConflict: "bdr_id,year,month" })
      .select().single()
    setSaving(false)
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return }
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.bdr_id === data.bdr_id && g.year === data.year && g.month === data.month)
      if (idx >= 0) { const next = [...prev]; next[idx] = data; return next }
      return [data, ...prev]
    })
    toast({ title: "Meta salva com sucesso!" })
    setOpen(false)
  }

  const sorted = [...goals].sort((a, b) => b.year - a.year || b.month - a.month)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Metas por BDR</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define as metas mensais para cada BDR</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Definir Meta
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma meta definida. Clique em "Definir Meta" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((g) => (
            <Card key={g.id} className="border-border bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">{memberMap[g.bdr_id] ?? "—"}</CardTitle>
                  <p className="text-xs text-muted-foreground">{MONTH_NAMES[g.month - 1]} {g.year}</p>
                </div>
                <button onClick={() => openEdit(g)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tentativas</span><Badge variant="secondary">{g.attempts_goal}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Atendimentos</span><Badge variant="secondary">{g.attendances_goal}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Agendadas</span><Badge variant="secondary">{g.meetings_scheduled_goal}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Realizadas</span><Badge variant="secondary">{g.meetings_done_goal}</Badge></div>
                  <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Lead Time</span><Badge variant="secondary">{g.lead_time_goal}d</Badge></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Definir Meta Mensal</DialogTitle>
            <DialogDescription>Configure os valores de meta para o BDR e mês selecionados.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>BDR</Label>
              <Select value={form.bdr_id} onValueChange={(v) => setForm((f) => ({ ...f, bdr_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o BDR" /></SelectTrigger>
                <SelectContent>
                  {members.filter((m) => m.is_active).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mês</Label>
              <Select value={form.month} onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ano</Label>
              <Select value={form.year} onValueChange={(v) => setForm((f) => ({ ...f, year: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {GOAL_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label>{label}</Label>
                <Input type="number" min="0" step={key === "lead_time_goal" ? "0.5" : "1"}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder="0" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
