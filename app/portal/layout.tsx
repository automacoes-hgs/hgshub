import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortalSidebar } from "@/components/portal/portal-sidebar"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_name, email")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") redirect("/admin/dashboard")

  const { data: tools } = await supabase
    .from("user_tools")
    .select("tool")
    .eq("user_id", user.id)
    .eq("enabled", true)

  const enabledTools = tools?.map((t) => t.tool) ?? []

  return (
    <div className="flex min-h-screen bg-background">
      <PortalSidebar
        companyName={profile?.company_name}
        userEmail={profile?.email ?? user.email}
        enabledTools={enabledTools}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
