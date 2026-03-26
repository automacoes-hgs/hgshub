"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import type { Contract } from "@/lib/types/contracts"
import { getContractStatus, getDaysRemaining } from "@/lib/types/contracts"
import { ClientsKpiCards } from "./clients-kpi-cards"
import { ClientsFilters } from "./clients-filters"
import { ContractsTable } from "./contracts-table"
import { ContractDialog } from "./contract-dialog"

type SortOption = "date-desc" | "date-asc" | "value-desc" | "value-asc" | "client-asc"

type Props = {
  contracts: Contract[]
}

export function ClientsPageClient({ contracts }: Props) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  const filtered = useMemo(() => {
    let result = [...contracts]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.client_name.toLowerCase().includes(q) ||
          c.product.toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      result = result.filter((c) => c.category === categoryFilter)
    }
    if (brandFilter) {
      result = result.filter((c) => c.brand === brandFilter)
    }
    if (dateFrom) {
      result = result.filter((c) => c.purchase_date >= dateFrom)
    }
    if (dateTo) {
      result = result.filter((c) => c.purchase_date <= dateTo)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.purchase_date.localeCompare(a.purchase_date)
        case "date-asc":
          return a.purchase_date.localeCompare(b.purchase_date)
        case "value-desc":
          return Number(b.value) - Number(a.value)
        case "value-asc":
          return Number(a.value) - Number(b.value)
        case "client-asc":
          return a.client_name.localeCompare(b.client_name, "pt-BR")
        default:
          return 0
      }
    })

    return result
  }, [contracts, search, categoryFilter, brandFilter, sortBy, dateFrom, dateTo])

  function handleEdit(contract: Contract) {
    setEditingContract(contract)
    setDialogOpen(true)
  }

  function handleNewContract() {
    setEditingContract(null)
    setDialogOpen(true)
  }

  function handleCloseDialog() {
    setDialogOpen(false)
    setEditingContract(null)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os contratos de clientes
          </p>
        </div>
        <button
          onClick={handleNewContract}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Contrato
        </button>
      </div>

      {/* KPI Cards — sempre com base nos dados completos */}
      <ClientsKpiCards contracts={contracts} />

      {/* Filtros */}
      <ClientsFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        brandFilter={brandFilter}
        onBrandChange={setBrandFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />

      {/* Contagem dos resultados */}
      <p className="text-sm text-muted-foreground mb-3">
        {filtered.length === contracts.length
          ? `${filtered.length} contratos`
          : `${filtered.length} de ${contracts.length} contratos`}
      </p>

      {/* Tabela */}
      <ContractsTable contracts={filtered} onEdit={handleEdit} />

      {/* Dialog */}
      <ContractDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        contract={editingContract}
      />
    </div>
  )
}
