import { createClient } from "@/lib/supabase/server"
import type { BdrMember, BdrGoal } from "@/lib/types/bdr"
import { BdrGoalsClient } from "@/components/admin/tools/bdr-goals-client"

export default async function BdrGoalsPage() {
  const supabase = await createClient()
  const [{ data: members }, { data: goals }] = await Promise.all([
    supabase.from("bdr_members").select("*").eq("is_active", true).order("name"),
    supabase.from("bdr_goals").select("*"),
  ])
  return (
    <BdrGoalsClient
      members={(members as BdrMember[]) ?? []}
      goals={(goals as BdrGoal[]) ?? []}
    />
  )
}
