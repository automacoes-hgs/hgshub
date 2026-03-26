"use client"

import { useState } from "react"
import { Plus, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { BdrMember } from "@/lib/types/bdr"

interface BdrMembersClientProps {
  members: BdrMember[]
}

export function BdrMembersClient({ members: initialMembers }: BdrMembersClientProps) {
  const [members, setMembers] = useState<BdrMember[]>(initialMembers)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "" })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    if (!form.name || !form.email) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bdr_members")
      .insert({ name: form.name.trim(), email: form.email.trim() })
      .select().single()
    setSaving(false)
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return }
    setMembers((prev) => [...prev, data])
    toast({ title: `${form.name} adicionado com sucesso!` })
    setForm({ name: "", email: "" })
    setOpen(false)
  }

  async function toggleActive(member: BdrMember) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bdr_members")
      .update({ is_active: !member.is_active })
      .eq("id", member.id).select().single()
    if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return }
    setMembers((prev) => prev.map((m) => m.id === data.id ? data : m))
    toast({ title: data.is_active ? `${data.name} reativado` : `${data.name} desativado` })
  }

  const active = members.filter((m) => m.is_active)
  const inactive = members.filter((m) => !m.is_active)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Equipe de BDRs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{active.length} BDR{active.length !== 1 ? "s" : ""} ativo{active.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar BDR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...active, ...inactive].map((m) => (
          <Card key={m.id} className="border-border bg-card">
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.is_active ? "bg-blue-600" : "bg-muted"}`}>
                  <span className={`text-sm font-bold ${m.is_active ? "text-white" : "text-muted-foreground"}`}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={m.is_active ? "default" : "secondary"}>
                  {m.is_active ? "Ativo" : "Inativo"}
                </Badge>
                <button onClick={() => toggleActive(m)} className="text-muted-foreground hover:text-foreground transition-colors" title={m.is_active ? "Desativar" : "Reativar"}>
                  {m.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {members.length === 0 && (
          <div className="col-span-full">
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Nenhum BDR cadastrado. Clique em "Adicionar BDR" para começar.
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar BDR</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
