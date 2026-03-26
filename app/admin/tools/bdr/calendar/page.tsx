import { createClient } from "@/lib/supabase/server"
import type { BdrMember, BdrDailyLog, BdrGoal } from "@/lib/types/bdr"
import { BdrCalendarClient } from "@/components/admin/tools/bdr-calendar-client"

export default async function BdrCalendarPage() {
  const supabase = await createClient()
  const [{ data: members }, { data: logs }, { data: goals }] = await Promise.all([
    supabase.from("bdr_members").select("*").eq("is_active", true).order("name"),
    supabase.from("bdr_daily_logs").select("*"),
    supabase.from("bdr_goals").select("*"),
  ])
  return (
    <BdrCalendarClient
      members={(members as BdrMember[]) ?? []}
      logs={(logs as BdrDailyLog[]) ?? []}
      goals={(goals as BdrGoal[]) ?? []}
    />
  )
}
