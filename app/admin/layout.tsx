import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_admin")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <AdminSidebar
        isAdmin={profile?.is_admin ?? false}
        userName={profile?.full_name || user.email || "Usuário"}
        userEmail={user.email || ""}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminHeader
          userName={profile?.full_name || user.email || "Usuário"}
          userEmail={user.email || ""}
          isAdmin={profile?.is_admin ?? false}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
