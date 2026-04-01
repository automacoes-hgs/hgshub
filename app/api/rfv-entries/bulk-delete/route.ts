import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verifica sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // DELETE com filtro por owner_id — a RLS garante segurança adicional
    const { error } = await supabase
      .from("client_rfv_entries")
      .delete()
      .in("id", ids)
      .eq("owner_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: ids.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
