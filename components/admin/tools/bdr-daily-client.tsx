"use client"

import { useState } from "react"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { BdrMember, BdrDailyLog } from "@/lib/types/bdr"

interface BdrDailyClientProps {
  members: BdrMember[]
  logs: BdrDailyLog[]
}

const FIELDS = [
  { key: "attempts",           label: "Tentativas de Contato" },
  { key: "attendances",        label: "Atendimentos" },
  { key: "decision_makers",    label: "Decisores Acessados" },
  { key: "qualifications",     label: "Qualificações" },
  { key: "meetings_scheduled", label: "Reuniões Agendadas" },
  { key: "meetings_done",      label: "Reuniões Realizadas" },
  { key: "lead_time_days",     label: "Lead Time (dias)" },
] as const

type FormData = {
  log_date: string
  bdr_id: string
  attempts: string
  attendances: string
  decision_makers: string
  qualifications: string
  meetings_scheduled: string
  meetings_done: string
  lead_time_days: string
}

function emptyForm(): FormData {
  return {
    log_date: new Date().toISOString().slice(0, 10),
    bdr_id: "",
    attempts: "",
    attendances: "",
    decision_makers: "",
    qualifications: "",
    meetings_scheduled: "",
    meetings_done: "",
    lead_time_days: "",
  }
}

export function BdrDailyClient({ members, logs: initialLogs }: BdrDailyClientProps) {
  const [logs, setLogs] = useState<BdrDailyLog[]>(initialLogs)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))

  function openNew() {
    setForm(emptyForm())
    setOpen(true)
  }

  function openEdit(log: BdrDailyLog) {
    setForm({
      log_date: log.log_date,
      bdr_id: log.bdr_id,
      attempts: String(log.attempts),
      attendances: String(log.attendances),
      decision_makers: String(log.decision_makers),
      qualifications: String(log.qualifications),
      meetings_scheduled: String(log.meetings_scheduled),
      meetings_done: String(log.meetings_done),
      lead_time_days: String(log.lead_time_days),
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.bdr_id || !form.log_date) {
      toast({ title: "Preencha a data e o BDR", variant: "destructive" })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      bdr_id:              form.bdr_id,
      log_date:            form.log_date,
      attempts:            Number(form.attempts) || 0,
      attendances:         Number(form.attendances) || 0,
      decision_makers:     Number(form.decision_makers) || 0,
      qualifications:      Number(form.qualifications) || 0,
      meetings_scheduled:  Number(form.meetings_scheduled) || 0,
      meetings_done:       Number(form.meetings_done) || 0,
      lead_time_days:      Number(form.lead_time_days) || 0,
    }

    const { data, error } = await supabase
      .from("bdr_daily_logs")
      .upsert(payload, { onConflict: "bdr_id,log_date" })
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
      return
    }
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.bdr_id === data.bdr_id && l.log_date === data.log_date)
      if (idx >= 0) { const next = [...prev]; next[idx] = data; return next }
      return [data, ...prev]
    })
    toast({ title: "Lançamento salvo com sucesso!" })
    setOpen(false)
  }

  const sorted = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Lançamento Diário</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Registre a performance diária de cada BDR</p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Lançamento
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum lançamento registrado ainda. Clique em "Registrar Lançamento" para começar.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">BDR</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Tentativas</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Atendimentos</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Decisores</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Qualificações</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Agendadas</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Realizadas</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Show Rate</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Lead Time</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((log) => {
                  const sr = log.meetings_scheduled > 0
                    ? Math.round((log.meetings_done / log.meetings_scheduled) * 100)
                    : 0
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-foreground font-medium">
                        {new Date(log.log_date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary">{memberMap[log.bdr_id] ?? "—"}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.attempts}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.attendances}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.decision_makers}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.qualifications}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.meetings_scheduled}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{log.meetings_done}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={sr >= 80 ? "text-emerald-600 font-semibold" : sr >= 50 ? "text-amber-600" : "text-red-600"}>
                          {sr}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground">{Number(log.lead_time_days).toFixed(1)}d</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => openEdit(log)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog de registro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Lançamento Diário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.log_date} onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))} />
            </div>
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
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  min="0"
                  step={key === "lead_time_days" ? "0.1" : "1"}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
