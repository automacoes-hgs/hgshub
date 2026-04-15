"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  Settings,
  LogOut,
  ChevronRight,
  Lock,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  locked?: boolean
}

interface PortalSidebarProps {
  companyName?: string | null
  userEmail?: string | null
  enabledTools?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Visão Geral", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Análise de RFV", href: "/portal/rfv", icon: TrendingUp },
  { label: "BDR Performance", href: "/portal/bdr", icon: Users },
  { label: "Metas e Resultados", href: "/portal/goals", icon: Target },
  { label: "Configurações", href: "/portal/settings", icon: Settings },
]

const TOOL_MAP: Record<string, string> = {
  "/portal/rfv": "rfv_analysis",
  "/portal/bdr": "bdr_performance",
  "/portal/goals": "goals_results",
}

export function PortalSidebar({ companyName, userEmail, enabledTools = [] }: PortalSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo / empresa */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-1">
          Portal do Cliente
        </p>
        <h1 className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
          {companyName ?? "Minha Empresa"}
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const toolKey = TOOL_MAP[item.href]
          const isLocked = toolKey !== undefined && !enabledTools.includes(toolKey)
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <div key={item.href}>
              {isLocked ? (
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed opacity-40"
                  title="Ferramenta não liberada pelo administrador"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
                  <span className="text-sm font-medium text-sidebar-foreground/60 flex-1">{item.label}</span>
                  <Lock className="h-3 w-3 text-sidebar-foreground/40" />
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary" : "")} />
                  <span className="text-sm flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 text-sidebar-primary" />}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{userEmail}</p>
          <p className="text-[10px] text-sidebar-foreground/40">Cliente</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
