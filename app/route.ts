import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const destination = user ? "/admin/dashboard" : "/auth/login"
  const url = new URL(destination, request.url)
  return NextResponse.redirect(url)
}
