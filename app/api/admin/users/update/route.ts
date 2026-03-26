import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Cliente admin com service role — bypassa RLS completamente
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  // Verifica que o solicitante é admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body = await request.json()
  const { action, userId } = body

  const admin = adminSupabase()

  if (action === "approve") {
    const { error } = await admin
      .from("profiles")
      .update({ approved_at: new Date().toISOString() })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === "role") {
    const { role } = body
    if (!["admin", "bdr_admin", "user", "bdr_user"].includes(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === "tool") {
    const { tool, enabled } = body
    const { error } = await admin
      .from("user_tools")
      .upsert(
        { user_id: userId, tool, enabled, enabled_at: enabled ? new Date().toISOString() : null },
        { onConflict: "user_id,tool" }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 })
}
