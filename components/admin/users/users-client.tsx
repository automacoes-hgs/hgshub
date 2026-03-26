"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  UserPlus,
  Users,
  ShieldCheck,
  User,
  Building2,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart3,
  Target,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

type UserRole = "admin" | "bdr_admin" | "user" | "bdr_user"
type ToolKey = "bdr_performance" | "rfv_analysis" | "goals_results"

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  company_name: string | null
  slug: string | null
  approved_at: string | null
  created_at: string
  is_admin: boolean
}

interface UserTool {
  user_id: string
  tool: ToolKey
  enabled: boolean
  enabled_at: string | null
}

interface UsersClientProps {
  profiles: Profile[]
  tools: UserTool[]
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  admin:     { label: "Admin",     color: "text-blue-700 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/40",   icon: ShieldCheck },
  bdr_admin: { label: "BDR Admin", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", icon: User },
  user:      { label: "Usuário",   color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: Building2 },
  bdr_user:  { label: "BDR User",  color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/40",  icon: User },
}

const TOOLS_CONFIG: { key: ToolKey; label: string; description: string; icon: React.ElementType }[] = [
  { key: "bdr_performance", label: "BDR Performance",       description: "Acompanhamento de performance de BDRs",      icon: BarChart3 },
  { key: "rfv_analysis",    label: "Análise de RFV",        description: "Segmentação e análise de clientes por RFV",  icon: TrendingUp },
  { key: "goals_results",   label: "Metas vs. Resultados",  description: "Definição e acompanhamento de metas",        icon: Target },
]

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user
  const Icon = cfg.icon
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

export function UsersClient({ profiles, tools }: UsersClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterRole, setFilterRole] = useState<string>("all")

  // Form state for create
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    slug: "",
    role: "user" as UserRole,
    password: "",
  })
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  // Index tools by user_id
  const toolsByUser: Record<string, Record<ToolKey, boolean>> = {}
  for (const t of tools) {
    if (!toolsByUser[t.user_id]) toolsByUser[t.user_id] = { bdr_performance: false, rfv_analysis: false, goals_results: false }
    toolsByUser[t.user_id][t.tool] = t.enabled
  }

  // Filter profiles
  const filtered = filterRole === "all"
    ? profiles
    : profiles.filter((p) => p.role === filterRole)

  // Counts
  const counts = {
    total: profiles.length,
    pending: profiles.filter((p) => !p.approved_at && p.role === "user").length,
    users: profiles.filter((p) => p.role === "user").length,
    admins: profiles.filter((p) => p.role === "admin").length,
  }

  async function handleApprove(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ approved_at: new Date().toISOString() })
      .eq("id", userId)
    if (error) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Usuário aprovado com sucesso" })
      startTransition(() => router.refresh())
    }
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
    if (error) {
      toast({ title: "Erro ao alterar role", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Nível de acesso atualizado" })
      startTransition(() => router.refresh())
    }
  }

  async function handleToolToggle(userId: string, tool: ToolKey, enabled: boolean) {
    const { error } = await supabase.from("user_tools").upsert(
      { user_id: userId, tool, enabled, enabled_at: enabled ? new Date().toISOString() : null },
      { onConflict: "user_id,tool" }
    )
    if (error) {
      toast({ title: "Erro ao alterar ferramenta", description: error.message, variant: "destructive" })
    } else {
      toast({ title: enabled ? "Ferramenta habilitada" : "Ferramenta desabilitada" })
      startTransition(() => router.refresh())
    }
  }

  async function handleCreate() {
    if (!form.email || !form.password) return
    setCreating(true)
    try {
      const { data, error } = await supabase.auth.admin
        ? // Fallback: usar signUp normal — o admin terá que aprovar depois
          await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: {
                full_name: form.full_name,
                company_name: form.company_name,
                slug: form.slug || form.email.split("@")[0],
                role: form.role,
              },
            },
          })
        : { data: null, error: new Error("sem acesso admin") }

      if (error) throw error

      // Aprovar imediatamente se criado pelo admin
      if (data?.user) {
        await supabase.from("profiles").update({
          approved_at: new Date().toISOString(),
          role: form.role,
          company_name: form.company_name,
          slug: form.slug || form.email.split("@")[0],
        }).eq("id", data.user.id)
      }

      toast({ title: "Usuário criado com sucesso" })
      setCreateOpen(false)
      setForm({ full_name: "", email: "", company_name: "", slug: "", role: "user", password: "" })
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast({ title: "Erro ao criar usuário", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  function openDrawer(user: Profile) {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  const userTools = selectedUser ? (toolsByUser[selectedUser.id] ?? { bdr_performance: false, rfv_analysis: false, goals_results: false }) : null

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie acessos, níveis de permissão e ferramentas disponíveis para cada cliente.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total de usuários", value: counts.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Clientes (user)", value: counts.users, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Admins", value: counts.admins, icon: ShieldCheck, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Pendentes de aprovação", value: counts.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label} className="border-border bg-card">
              <CardContent className="pt-5 pb-5 flex flex-col gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
                  <Icon className={cn("h-4 w-4", c.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                  <p className={cn("text-2xl font-bold tracking-tight mt-0.5", c.color)}>{c.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabela */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">Lista de usuários</CardTitle>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-8 w-44 text-sm border-border bg-background">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="bdr_admin">BDR Admin</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="bdr_user">BDR User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left font-medium px-6 py-3">Usuário</th>
                    <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Empresa</th>
                    <th className="text-left font-medium px-4 py-3">Nível</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Status</th>
                    <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Ferramentas</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => {
                    const initials = (u.full_name || u.email || "U").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                    const approved = !!u.approved_at
                    const uTools = toolsByUser[u.id] ?? {}
                    const enabledCount = Object.values(uTools).filter(Boolean).length
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{u.full_name || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell text-muted-foreground">
                          {u.company_name || <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <RoleBadge role={u.role ?? "user"} />
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          {approved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle className="h-3 w-3" /> Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Clock className="h-3 w-3" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {enabledCount}/{TOOLS_CONFIG.length} ativas
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openDrawer(u)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal criar usuário */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo acesso. O usuário será aprovado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input id="full_name" placeholder="João Silva" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company_name">Empresa</Label>
                <Input id="company_name" placeholder="Empresa Ltda" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="joao@empresa.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Senha inicial</Label>
                <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Identificador (slug)</Label>
                <Input id="slug" placeholder="empresa-abc" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nível de acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário (cliente)</SelectItem>
                  <SelectItem value="bdr_user">BDR User</SelectItem>
                  <SelectItem value="bdr_admin">BDR Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !form.email || !form.password}>
              {creating ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer detalhes do usuário */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">
                      {(selectedUser.full_name || selectedUser.email || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <SheetTitle className="text-base">{selectedUser.full_name || "Sem nome"}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-6 py-6">
                {/* Info */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informações</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Empresa</p><p className="font-medium">{selectedUser.company_name || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Slug</p><p className="font-medium font-mono text-xs">{selectedUser.slug || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cadastro</p><p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString("pt-BR")}</p></div>
                    <div><p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedUser.approved_at
                        ? <span className="text-emerald-600">Aprovado</span>
                        : <span className="text-amber-600">Pendente</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nível de acesso */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nível de acesso</p>
                  <Select
                    value={selectedUser.role ?? "user"}
                    onValueChange={(v) => handleRoleChange(selectedUser.id, v as UserRole)}
                  >
                    <SelectTrigger className="border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário (cliente)</SelectItem>
                      <SelectItem value="bdr_user">BDR User</SelectItem>
                      <SelectItem value="bdr_admin">BDR Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Aprovação */}
                {!selectedUser.approved_at && (
                  <Button
                    onClick={() => handleApprove(selectedUser.id)}
                    className="gap-2"
                    disabled={isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar acesso
                  </Button>
                )}

                {/* Ferramentas */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas liberadas</p>
                  <div className="flex flex-col gap-3">
                    {TOOLS_CONFIG.map((tool) => {
                      const Icon = tool.icon
                      const enabled = userTools?.[tool.key] ?? false
                      return (
                        <div key={tool.key} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{tool.label}</p>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(v) => handleToolToggle(selectedUser.id, tool.key, v)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
