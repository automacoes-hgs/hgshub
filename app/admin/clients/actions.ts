"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { Brand } from "@/lib/types/contracts"

export type ContractFormData = {
  client_name: string
  category: string
  product: string
  brand: Brand
  value: number
  purchase_date: string
  custom_end_date?: string | null
  has_bonus: boolean
  observations?: string | null
  secondary_brand?: Brand | null
  secondary_brand_value?: number | null
}

export async function createContract(data: ContractFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("contracts").insert({
    ...data,
    custom_end_date: data.custom_end_date || null,
    observations: data.observations || null,
    secondary_brand: data.secondary_brand || null,
    secondary_brand_value: data.secondary_brand_value || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function updateContract(id: string, data: ContractFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase
    .from("contracts")
    .update({
      ...data,
      custom_end_date: data.custom_end_date || null,
      observations: data.observations || null,
      secondary_brand: data.secondary_brand || null,
      secondary_brand_value: data.secondary_brand_value || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function deleteContract(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("contracts").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/admin/clients")
  return { success: true }
}
