import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const destination = user ? "/admin/dashboard" : "/auth/login"

  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content={`0;url=${destination}`} />
      </head>
      <body />
    </html>
  )
}
