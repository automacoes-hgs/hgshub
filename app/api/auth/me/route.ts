import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getHomeByRole } from "@/lib/role-redirect"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ redirect: "/auth/login" })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, slug")
    .eq("id", user.id)
    .single()

  const redirect = getHomeByRole(profile?.role ?? "user", profile?.slug)
  return NextResponse.json({ redirect })
}
