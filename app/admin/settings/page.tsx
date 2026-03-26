import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/admin/settings/settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_admin, created_at")
    .eq("id", user!.id)
    .single()

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, created_at")
    .order("created_at", { ascending: true })

  return (
    <SettingsClient
      currentUser={{
        id: user!.id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? user?.email ?? "",
        is_admin: profile?.is_admin ?? false,
        created_at: profile?.created_at ?? "",
      }}
      teamMembers={teamMembers ?? []}
    />
  )
}
