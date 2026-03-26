import { createClient } from "@/lib/supabase/server"
import { PortalSettingsClient } from "@/components/portal/portal-settings-client"

export default async function PortalSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, company_name, slug, role")
    .eq("id", user!.id)
    .single()

  const { data: bdrMembers } = await supabase
    .from("bdr_members")
    .select("id, name, email, is_active, created_at")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <PortalSettingsClient
      profile={{ ...profile, id: user!.id }}
      bdrMembers={bdrMembers ?? []}
    />
  )
}
