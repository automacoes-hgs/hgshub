import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const destination = user ? "/admin/dashboard" : "/auth/login"
  return NextResponse.redirect(
    new URL(destination, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  )
}
