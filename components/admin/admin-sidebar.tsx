"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  HeartPulse,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard Geral", href: "/admin", icon: LayoutDashboard },
  { label: "Clientes", href: "/admin/clients", icon: Building2 },
  { label: "Qualidade", href: "/admin/quality", icon: HeartPulse },
  { label: "Análise RFV", href: "/admin/rfv", icon: PieChart },
  { label: "Configurações", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  isAdmin: boolean
  userName: string
  userEmail: string
}

export function AdminSidebar({ isAdmin, userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const initial = userName.charAt(0).toUpperCase()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border min-h-screen shrink-0">

      {/* Logo */}
      <div className="flex flex-col gap-0.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <Image
            src="https://eusouhgs.com.br/wp-content/uploads/2025/07/2.png"
            alt="HGS Soluções em Gestão"
            width={28}
            height={28}
            className="rounded object-contain shrink-0"
            unoptimized
          />
          <span className="text-sm font-bold text-sidebar-foreground leading-tight">
            HGS Soluções em Gestão
          </span>
        </div>
        <span className="text-xs text-sidebar-foreground/50 pl-[38px]">
          Painel Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/dashboard"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors relative",
                active
                  ? "bg-blue-600 text-white border-l-[3px] border-white pl-[calc(0.75rem-3px)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-4 border-t border-sidebar-border flex flex-col gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initial}</span>
          </div>
          {/* Nome e email */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
              {userName}
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 truncate leading-tight">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Botão Sair */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
