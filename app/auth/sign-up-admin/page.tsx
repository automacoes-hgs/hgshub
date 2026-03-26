"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ShieldPlus } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { FormMessage } from "@/components/auth/form-message"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpAdminPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminKey, setAdminKey] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SIGNUP_KEY ?? "acessoadminpermitido"
    if (adminKey !== expectedKey) {
      setError("Chave de administrador inválida.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/auth/login`,
        data: {
          full_name: fullName,
          is_admin: true,
        },
      },
    })

    if (error) {
      setError(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar conta. Tente novamente.")
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Criar conta de administrador"
      subtitle="Acesso restrito — requer chave de autorização"
    >
      {success ? (
        <div className="space-y-6">
          <FormMessage
            type="success"
            message="Conta de administrador criada! Verifique seu e-mail para confirmar antes de fazer login."
          />
          <Link href="/auth/login">
            <Button variant="outline" className="w-full h-11">
              Ir para o login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-5">
          {error && <FormMessage type="error" message={error} />}

          {/* Badge de aviso */}
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
            <ShieldPlus className="h-4 w-4 text-accent shrink-0" />
            <p className="text-xs text-accent font-medium">
              Cadastro de acesso administrativo completo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Nome completo
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="João da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="h-11 bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11 pr-11 bg-background border-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirmar senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11 pr-11 bg-background border-border"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminKey" className="text-sm font-medium text-foreground">
              Chave de administrador
            </Label>
            <Input
              id="adminKey"
              type="password"
              placeholder="Chave de acesso fornecida"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
              className="h-11 bg-background border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldPlus className="mr-2 h-4 w-4" />
            )}
            {loading ? "Criando conta..." : "Criar conta admin"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}
