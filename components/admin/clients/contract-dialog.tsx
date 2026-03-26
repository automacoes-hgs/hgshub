"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronUp } from "lucide-react"
import { CATEGORIES, BRANDS } from "@/lib/types/contracts"
import type { Contract, Brand } from "@/lib/types/contracts"
import { createContract, updateContract } from "@/app/admin/clients/actions"

type Props = {
  open: boolean
  onClose: () => void
  contract?: Contract | null
}

const EMPTY_FORM = {
  client_name: "",
  category: "",
  product: "",
  brand: "" as Brand | "",
  value: "",
  purchase_date: "",
  custom_end_date: "",
  has_bonus: false,
  observations: "",
  secondary_brand: "" as Brand | "",
  secondary_brand_value: "",
}

export function ContractDialog({ open, onClose, contract }: Props) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [showRateio, setShowRateio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contract) {
      setForm({
        client_name: contract.client_name,
        category: contract.category,
        product: contract.product,
        brand: contract.brand,
        value: String(contract.value),
        purchase_date: contract.purchase_date,
        custom_end_date: contract.custom_end_date ?? "",
        has_bonus: contract.has_bonus,
        observations: contract.observations ?? "",
        secondary_brand: contract.secondary_brand ?? "",
        secondary_brand_value: contract.secondary_brand_value ? String(contract.secondary_brand_value) : "",
      })
      setShowRateio(!!contract.secondary_brand)
    } else {
      setForm({ ...EMPTY_FORM })
      setShowRateio(false)
    }
    setError(null)
  }, [contract, open])

  function set(field: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.client_name || !form.category || !form.product || !form.brand || !form.value || !form.purchase_date) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }

    setLoading(true)
    const payload = {
      client_name: form.client_name,
      category: form.category,
      product: form.product,
      brand: form.brand as Brand,
      value: parseFloat(form.value.replace(",", ".")),
      purchase_date: form.purchase_date,
      custom_end_date: form.custom_end_date || null,
      has_bonus: form.has_bonus,
      observations: form.observations || null,
      secondary_brand: showRateio && form.secondary_brand ? (form.secondary_brand as Brand) : null,
      secondary_brand_value:
        showRateio && form.secondary_brand_value
          ? parseFloat(form.secondary_brand_value.replace(",", "."))
          : null,
    }

    const result = contract
      ? await updateContract(contract.id, payload)
      : await createContract(payload)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            {contract ? "Editar Contrato" : "Novo Contrato"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Cliente e Produto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Cliente / Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                placeholder="Nome da empresa"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Produto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.product}
                onChange={(e) => set("product", e.target.value)}
                placeholder="Nome do produto"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Categoria e Marca */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Selecione a categoria</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} — Ciclo: {cat.cycleDays} dias
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Marca <span className="text-red-500">*</span>
              </label>
              <select
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">Selecione a marca</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor e Data de Compra */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Data de Compra <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => set("purchase_date", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Data de encerramento personalizada */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Data de Encerramento Personalizada
              <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
            </label>
            <input
              type="date"
              value={form.custom_end_date}
              onChange={(e) => set("custom_end_date", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se não informada, o encerramento será calculado automaticamente pelo ciclo da categoria.
            </p>
          </div>

          {/* Rateio entre marcas */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRateio((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <span>Rateio entre marcas <span className="text-muted-foreground font-normal">(opcional)</span></span>
              {showRateio ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showRateio && (
              <div className="px-4 pb-4 pt-2 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Marca Secundária</label>
                  <select
                    value={form.secondary_brand}
                    onChange={(e) => set("secondary_brand", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Selecione</option>
                    {BRANDS.filter((b) => b !== form.brand).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Valor de Soluções (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.secondary_brand_value}
                    onChange={(e) => set("secondary_brand_value", e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Produto Bônus */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.has_bonus}
              onClick={() => set("has_bonus", !form.has_bonus)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                form.has_bonus ? "bg-blue-600" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  form.has_bonus ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => set("has_bonus", !form.has_bonus)}>
              Possui produto bônus
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
            <textarea
              value={form.observations}
              onChange={(e) => set("observations", e.target.value)}
              rows={3}
              placeholder="Notas adicionais sobre o contrato..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="contract-form"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : contract ? "Salvar Alterações" : "Criar Contrato"}
          </button>
        </div>
      </div>
    </div>
  )
}
