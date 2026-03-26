"use client"

import { useState } from "react"
import { Building2, Users, Save, UserPlus, ShieldCheck, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  is_admin: boolean | null
  created_at: string
}

interface Props {
  currentUser: ProfileRow
  teamMembers: ProfileRow[]
}

type Tab = "empresa" | "equipe"

export function SettingsClient({ currentUser, teamMembers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("empresa")

  // Perfil da empresa
  const [companyName, setCompanyName] = useState("HGS Soluções em Gestão")
  const [contactEmail, setContactEmail] = useState("contato@eusouhgs.com.br")
  const [phone, setPhone] = useState("")
  const [saveToast, setSaveToast] = useState(false)
  const [inviteToast, setInviteToast] = useState(false)

  function handleSave() {
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 3000)
  }

  function handleInvite() {
    setInviteToast(true)
    setTimeout(() => setInviteToast(false), 3000)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "empresa", label: "Perfil da Empresa", icon: Building2 },
    { id: "equipe", label: "Equipe", icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configurações da empresa e da equipe.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab: Perfil da Empresa */}
      {activeTab === "empresa" && (
        <Card className="max-w-xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              Perfil da Empresa
            </CardTitle>
            <CardDescription>
              Informações básicas da empresa exibidas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                E-mail de Contato
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
              {saveToast && (
                <span className="text-sm text-green-600 font-medium animate-in fade-in">
                  Salvo com sucesso
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Equipe */}
      {activeTab === "equipe" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {teamMembers.length} {teamMembers.length === 1 ? "membro" : "membros"} na equipe
            </p>
            <div className="flex items-center gap-3">
              {inviteToast && (
                <span className="text-sm text-muted-foreground animate-in fade-in">
                  Funcionalidade em desenvolvimento
                </span>
              )}
              <button
                onClick={handleInvite}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Convidar Membro
              </button>
            </div>
          </div>

          <Card className="border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      E-mail
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Perfil
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Desde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teamMembers.map((member) => {
                    const isAdmin = member.is_admin ?? false
                    const since = member.created_at
                      ? new Date(member.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                    const initial = (member.full_name || member.email || "?")
                      .charAt(0)
                      .toUpperCase()
                    return (
                      <tr
                        key={member.id}
                        className={cn(
                          "hover:bg-muted/50 transition-colors",
                          member.id === currentUser.id && "bg-muted/30"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">{initial}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground leading-tight">
                                {member.full_name || "—"}
                              </span>
                              {member.id === currentUser.id && (
                                <span className="text-[11px] text-muted-foreground">você</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {member.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              <User className="h-3 w-3" />
                              Usuário
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{since}</td>
                      </tr>
                    )
                  })}
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        Nenhum membro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
