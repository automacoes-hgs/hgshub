import { createClient } from "@/lib/supabase/server"
import type { BdrMember, BdrGoal, BdrDailyLog } from "@/lib/types/bdr"
import { BdrOverviewClient } from "@/components/admin/tools/bdr-overview-client"

export default async function BdrPage() {
  const supabase = await createClient()

  const [{ data: members }, { data: goals }, { data: logs }] = await Promise.all([
    supabase.from("bdr_members").select("*").eq("is_active", true).order("name"),
    supabase.from("bdr_goals").select("*"),
    supabase.from("bdr_daily_logs").select("*").order("log_date", { ascending: false }),
  ])

  return (
    <BdrOverviewClient
      members={(members as BdrMember[]) ?? []}
      goals={(goals as BdrGoal[]) ?? []}
      logs={(logs as BdrDailyLog[]) ?? []}
    />
  )
}
