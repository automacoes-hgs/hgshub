"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart2, CalendarDays, Target, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const BDR_NAV = [
  { label: "Visão Geral",       href: "/admin/tools/bdr",            icon: BarChart2 },
  { label: "Lançamento Diário", href: "/admin/tools/bdr/daily",      icon: TrendingUp },
  { label: "Calendário",        href: "/admin/tools/bdr/calendar",   icon: CalendarDays },
  { label: "Metas",             href: "/admin/tools/bdr/goals",      icon: Target },
  { label: "BDRs",              href: "/admin/tools/bdr/members",    icon: Users },
]

export function BdrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Se estiver na raiz de /admin/tools, não renderiza a sidebar BDR
  const inBdr = pathname.startsWith("/admin/tools/bdr") || pathname === "/admin/tools/bdr"

  if (!inBdr) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ferramentas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ferramentas operacionais da equipe HGS</p>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-4rem)] -mx-6 -mt-6">
      {/* Sidebar interna BDR */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col pt-6">
        <div className="px-5 pb-4 border-b border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">BDR Dashboard</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Performance</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {BDR_NAV.map((item) => {
            const Icon = item.icon
            const active =
              item.href === "/admin/tools/bdr"
                ? pathname === "/admin/tools/bdr"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
                  active
                    ? "bg-blue-600 text-white font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 px-6 py-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
