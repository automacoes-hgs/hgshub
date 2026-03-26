import { createClient } from "@/lib/supabase/server"
import type { BdrMember } from "@/lib/types/bdr"
import { BdrMembersClient } from "@/components/admin/tools/bdr-members-client"

export default async function BdrMembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase.from("bdr_members").select("*").order("name")
  return <BdrMembersClient members={(members as BdrMember[]) ?? []} />
}
