import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dest = user ? "/admin/dashboard" : "/auth/login"

  // Usa window.location para evitar o erro "Router action dispatched before initialization"
  // que ocorre quando redirect() do Next.js é chamado antes do router do cliente estar pronto
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.replace(${JSON.stringify(dest)})`,
      }}
    />
  )
}
