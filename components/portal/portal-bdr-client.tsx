"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Phone, Calendar, Users, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Empty } from "@/components/ui/empty"

interface Member { id: string; name: string; email: string; is_active: boolean }
interface Log {
  id: string; bdr_id: string; log_date: string
  attempts: number; attendances: number; decision_makers: number
  qualifications: number; meetings_scheduled: number; meetings_done: number
  lead_time_days: number; notes?: string | null
}

interface Props { ownerId: string; members: Member[]; logs: Log[] }

const EMPTY_FORM = {
  bdr_id: "", log_date: new Date().toISOString().slice(0, 10),
  attempts: "", attendances: "", decision_makers: "",
  qualifications: "", meetings_scheduled: "", meetings_done: "",
  lead_time_days: "", notes: "",
}

export function PortalBdrClient({ ownerId, members, logs: initialLogs }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // KPIs do mês atual
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const monthLogs = logs.filter((l) => l.log_date.startsWith(monthKey))
  const total = (key: keyof Log) => monthLogs.reduce((s, l) => s + Number(l[key] ?? 0), 0)

  const showRate = total("meetings_scheduled") > 0
    ? Math.round((total("meetings_done") / total("meetings_scheduled")) * 100)
    : 0

  async function handleSave() {
    const payload = {
      owner_id: ownerId,
      bdr_id: form.bdr_id,
      log_date: form.log_date,
      attempts: Number(form.attempts) || 0,
      attendances: Number(form.attendances) || 0,
      decision_makers: Number(form.decision_makers) || 0,
      qualifications: Number(form.qualifications) || 0,
      meetings_scheduled: Number(form.meetings_scheduled) || 0,
      meetings_done: Number(form.meetings_done) || 0,
      lead_time_days: Number(form.lead_time_days) || 0,
      notes: form.notes || null,
    }

    const { error } = await supabase
      .from("bdr_daily_logs")
      .upsert(payload, { onConflict: "bdr_id,log_date" })

    if (error) {
      toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Lançamento registrado com sucesso" })
      setOpen(false)
      setForm(EMPTY_FORM)
      startTransition(() => router.refresh())
    }
  }

  const field = (label: string, key: keyof typeof form) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="h-8 text-sm"
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">BDR Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">Registre e acompanhe os lançamentos diários da equipe.</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-2" disabled={members.length === 0}>
          <Plus className="h-4 w-4" />
          Registrar lançamento
        </Button>
      </div>

      {/* KPI cards do mês */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tentativas", value: total("attempts"), icon: Phone },
          { label: "Atendimentos", value: total("attendances"), icon: Users },
          { label: "Reuniões Ag.", value: total("meetings_scheduled"), icon: Calendar },
          { label: "Show Rate", value: `${showRate}%`, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">mês atual</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de lançamentos recentes */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lançamentos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <Empty title="Nenhum lançamento" description="Registre o primeiro lançamento diário para começar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Data", "BDR", "Tentativas", "Atend.", "Decisores", "Qualif.", "Reun. Ag.", "Reun. Realiz.", "Lead Time"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.slice(0, 20).map((log) => {
                    const member = members.find((m) => m.id === log.bdr_id)
                    const date = new Date(log.log_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                    return (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3 text-foreground font-medium whitespace-nowrap">{date}</td>
                        <td className="py-2.5 px-3 text-foreground whitespace-nowrap">{member?.name ?? "—"}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.attempts}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.attendances}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.decision_makers}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.qualifications}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.meetings_scheduled}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.meetings_done}</td>
                        <td className="py-2.5 px-3 text-center text-foreground">{log.lead_time_days}d</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de registro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar lançamento diário</DialogTitle>
            <DialogDescription>Preencha os dados do dia para o BDR selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">BDR</Label>
                <Select value={form.bdr_id} onValueChange={(v) => setForm((f) => ({ ...f, bdr_id: v }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={form.log_date}
                  onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {field("Tentativas de contato", "attempts")}
              {field("Atendimentos", "attendances")}
              {field("Decisores acessados", "decision_makers")}
              {field("Qualificações", "qualifications")}
              {field("Reuniões agendadas", "meetings_scheduled")}
              {field("Reuniões realizadas", "meetings_done")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lead Time (dias)</Label>
              <Input
                type="number"
                min={0}
                value={form.lead_time_days}
                onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || !form.bdr_id || !form.log_date}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
