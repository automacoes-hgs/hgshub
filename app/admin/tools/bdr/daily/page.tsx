import { createClient } from "@/lib/supabase/server"
import type { BdrMember, BdrDailyLog } from "@/lib/types/bdr"
import { BdrDailyClient } from "@/components/admin/tools/bdr-daily-client"

export default async function BdrDailyPage() {
  const supabase = await createClient()
  const [{ data: members }, { data: logs }] = await Promise.all([
    supabase.from("bdr_members").select("*").eq("is_active", true).order("name"),
    supabase.from("bdr_daily_logs").select("*").order("log_date", { ascending: false }),
  ])
  return (
    <BdrDailyClient
      members={(members as BdrMember[]) ?? []}
      logs={(logs as BdrDailyLog[]) ?? []}
    />
  )
}
