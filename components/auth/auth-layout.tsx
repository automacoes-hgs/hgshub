"use client"

import { ShieldCheck } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Painel esquerdo — visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--auth-bg)] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grade decorativa */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.92 0.01 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.92 0.01 240) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-accent-foreground" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            AdminPanel
          </span>
        </div>

        {/* Texto central */}
        <div className="relative space-y-4">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            Sistema de Gestão
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight text-balance">
            Controle total na palma da mão
          </h1>
          <p className="text-base text-white/50 leading-relaxed text-pretty max-w-sm">
            Gerencie usuários, monitore métricas e tome decisões com dados em
            tempo real.
          </p>
        </div>

        {/* Rodapé */}
        <div className="relative">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} AdminPanel. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight">
              AdminPanel
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
