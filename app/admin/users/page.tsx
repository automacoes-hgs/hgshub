import { createClient } from "@/lib/supabase/server"
import { UsersClient } from "@/components/admin/users/users-client"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_name, slug, approved_at, created_at, is_admin")
    .order("created_at", { ascending: false })

  const { data: tools } = await supabase
    .from("user_tools")
    .select("user_id, tool, enabled, enabled_at")

  return (
    <UsersClient
      profiles={profiles ?? []}
      tools={tools ?? []}
    />
  )
}
