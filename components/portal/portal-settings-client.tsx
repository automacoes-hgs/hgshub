"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { User, Building2, Users, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Empty } from "@/components/ui/empty"

interface Profile {
  id: string
  full_name?: string | null
  email?: string | null
  company_name?: string | null
  slug?: string | null
  role?: string | null
}

interface BdrMember {
  id: string
  name: string
  email: string
  is_active: boolean
  created_at: string
}

interface Props { profile: Profile | null; bdrMembers: BdrMember[] }

export function PortalSettingsClient({ profile, bdrMembers: initial }: Props) {
  const [members, setMembers] = useState(initial)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "" })
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? "",
    company_name: profile?.company_name ?? "",
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  async function handleSaveProfile() {
    setSavingProfile(true)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profileForm.full_name, company_name: profileForm.company_name })
      .eq("id", profile!.id)
    setSavingProfile(false)
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Dados atualizados com sucesso" })
      startTransition(() => router.refresh())
    }
  }

  async function handleAddBdr() {
    const { error } = await supabase.from("bdr_members").insert({
      name: form.name,
      email: form.email,
      owner_id: profile!.id,
      is_active: true,
    })
    if (error) {
      toast({ title: "Erro ao adicionar BDR", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "BDR adicionado com sucesso" })
      setAddOpen(false)
      setForm({ name: "", email: "" })
      startTransition(() => router.refresh())
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    const { error } = await supabase.from("bdr_members").update({ is_active: !current }).eq("id", id)
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } else {
      startTransition(() => router.refresh())
    }
  }

  async function handleRemoveBdr(id: string) {
    const { error } = await supabase.from("bdr_members").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "BDR removido" })
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus dados cadastrais e a equipe de BDRs.</p>
      </div>

      {/* Dados cadastrais */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Dados da empresa
          </CardTitle>
          <CardDescription>Informações da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome da empresa</Label>
              <Input
                value={profileForm.company_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, company_name: e.target.value }))}
                placeholder="Empresa"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={profile?.email ?? ""} disabled className="opacity-60" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm">
              {savingProfile ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BDRs */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                Equipe de BDRs
              </CardTitle>
              <CardDescription>Gerencie os BDRs que alimentam os dados da sua operação.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <Empty title="Nenhum BDR cadastrado" description="Adicione BDRs para que possam lançar os dados da operação." />
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={m.is_active ? "default" : "secondary"}
                      className={m.is_active ? "bg-green-500/10 text-green-600 border-green-200" : ""}
                    >
                      {m.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <button
                      onClick={() => handleToggleActive(m.id, m.is_active)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={m.is_active ? "Desativar" : "Ativar"}
                    >
                      {m.is_active
                        ? <XCircle className="h-4 w-4 text-muted-foreground" />
                        : <CheckCircle2 className="h-4 w-4 text-green-600" />
                      }
                    </button>
                    <button
                      onClick={() => handleRemoveBdr(m.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal adicionar BDR */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar BDR</DialogTitle>
            <DialogDescription>Cadastre um novo BDR para a sua equipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do BDR" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddBdr} disabled={isPending || !form.name || !form.email}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
