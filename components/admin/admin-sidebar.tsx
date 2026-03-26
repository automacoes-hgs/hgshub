"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Usuários", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "Relatórios", href: "/admin/reports", icon: BarChart3 },
  { label: "Configurações", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  isAdmin: boolean
}

export function AdminSidebar({ isAdmin }: AdminSidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border min-h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          AdminPanel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 mb-3 text-xs font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
          Menu
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Badge admin */}
      {isAdmin && (
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-sidebar-primary shrink-0" />
            <span className="text-xs font-medium text-sidebar-foreground/70">
              Acesso Administrador
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
