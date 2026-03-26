import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Rota raiz: redireciona para /admin/dashboard ou /auth/login
 * Usa NextResponse.redirect (HTTP 302) em vez de redirect() do next/navigation
 * para evitar "Router action dispatched before initialization" no preview do Next.js.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const destination = user ? "/admin/dashboard" : "/auth/login"
  return NextResponse.redirect(new URL(destination, request.url))
}
