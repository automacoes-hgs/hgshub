import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { getHomeByRole } from "@/lib/role-redirect"

/**
 * Rota raiz: redireciona para a home correta de acordo com o role do usuário.
 * Usa NextResponse.redirect (HTTP 302) — redirect puro sem envolver o router do cliente.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, slug")
    .eq("id", user.id)
    .single()

  const destination = getHomeByRole(profile?.role ?? "user", profile?.slug)
  return NextResponse.redirect(new URL(destination, request.url))
}
