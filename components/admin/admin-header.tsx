"use client"

import { useRouter } from "next/navigation"
import { LogOut, User, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface AdminHeaderProps {
  userName: string
  userEmail: string
  isAdmin: boolean
}

export function AdminHeader({ userName, userEmail, isAdmin }: AdminHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Painel Administrativo</h1>
        <p className="text-xs text-muted-foreground">
          Gerencie seu sistema com facilidade
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2.5 h-10 px-3 hover:bg-secondary"
          >
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-medium text-foreground leading-none">
                {userName.split(" ")[0]}
              </span>
              {isAdmin && (
                <span className="text-[10px] text-accent font-medium leading-none mt-0.5">
                  Admin
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Badge className="text-xs bg-accent/10 text-accent border-accent/20 hover:bg-accent/10">
                  Administrador
                </Badge>
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer text-muted-foreground focus:text-foreground">
            <User className="mr-2 h-4 w-4" />
            Meu perfil
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
