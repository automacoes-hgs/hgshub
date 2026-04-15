"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ── Types ──────────────────────────────────────────────────────────────────

export type CompanyFormData = {
  name: string
  slug: string
  description?: string | null
}

export type GoalFormData = {
  company_id: string
  unidade?: string | null
  tipo_receita?: "MRR" | "MRU" | null
  ano: number
  mes?: number | null
  categoria?: string | null
  valor_meta: number
  resultado: number
  meta_clientes?: number | null
  ticket_medio?: number | null
  observacoes?: string | null
}

// ── Company Actions ────────────────────────────────────────────────────────

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("companies")
    .select("*, company_goals(count)")
    .order("name")
  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createCompany(data: CompanyFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const slug = data.slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")

  const { error } = await supabase.from("companies").insert({
    name: data.name.trim(),
    slug,
    description: data.description || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function updateCompany(id: string, data: CompanyFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("companies")
    .update({
      name: data.name.trim(),
      slug: data.slug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: data.description || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("companies").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

// ── Goal Actions ───────────────────────────────────────────────────────────

export async function getGoalsByCompany(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("company_goals")
    .select("*")
    .eq("company_id", companyId)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false, nullsFirst: false })
  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createGoal(data: GoalFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("company_goals").insert({
    company_id: data.company_id,
    unidade: data.unidade || null,
    tipo_receita: data.tipo_receita || null,
    ano: data.ano,
    mes: data.mes || null,
    categoria: data.categoria || null,
    valor_meta: data.valor_meta,
    resultado: data.resultado,
    meta_clientes: data.meta_clientes || null,
    ticket_medio: data.ticket_medio || null,
    observacoes: data.observacoes || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function updateGoal(id: string, data: Omit<GoalFormData, "company_id">) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("company_goals")
    .update({
      unidade: data.unidade || null,
      tipo_receita: data.tipo_receita || null,
      ano: data.ano,
      mes: data.mes || null,
      categoria: data.categoria || null,
      valor_meta: data.valor_meta,
      resultado: data.resultado,
      meta_clientes: data.meta_clientes || null,
      ticket_medio: data.ticket_medio || null,
      observacoes: data.observacoes || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("company_goals").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

// ── Company Users (Responsáveis) Actions ──────────────────────────────────

export type CompanyUser = {
  id: string
  company_id: string
  user_id: string
  created_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    is_admin: boolean
  }
}

export async function getCompanyUsers(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("company_users")
    .select("*, profiles(id, email, full_name, is_admin)")
    .eq("company_id", companyId)
    .order("created_at")
  if (error) return { error: error.message, data: null }
  return { data: data as CompanyUser[], error: null }
}

export async function addCompanyUser(companyId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function removeCompanyUser(companyUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("company_users").delete().eq("id", companyUserId)
  if (error) return { error: error.message }
  revalidatePath("/admin/companies")
  return { success: true }
}

export async function getAllProfiles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_admin")
    .eq("is_admin", false)
    .order("email")
  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

// ── Portal: metas por usuário responsável ─────────────────────────────────

export async function getMyCompanyGoals() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado", data: null }

  // Busca todas as vinculações do usuário + metas da empresa
  const { data, error } = await supabase
    .from("company_users")
    .select(`
      company_id,
      companies (
        id,
        name,
        slug,
        description,
        company_goals (
          id, unidade, tipo_receita, ano, mes,
          categoria, valor_meta, resultado,
          meta_clientes, ticket_medio, observacoes
        )
      )
    `)
    .eq("user_id", user.id)

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}
