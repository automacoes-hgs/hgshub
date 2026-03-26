"use client"

import { useState, useMemo } from "react"
import { Plus, LayoutGrid, List } from "lucide-react"
import type { Contract } from "@/lib/types/contracts"
import type { RfvSegment, ClientRfv } from "@/lib/rfv"
import { computeClientsRfv } from "@/lib/rfv"
import { ClientsKpiCards } from "./clients-kpi-cards"
import { ClientsFilters } from "./clients-filters"
import { ContractsTable } from "./contracts-table"
import { ContractDialog } from "./contract-dialog"
import { ClientsGrid } from "./clients-grid"
import { ClientDetailModal } from "./client-detail-modal"

type SortOption = "date-desc" | "date-asc" | "value-desc" | "value-asc" | "client-asc"
type ViewMode = "grid" | "list"

type Props = {
  contracts: Contract[]
}

export function ClientsPageClient({ contracts }: Props) {
  // View mode: grade de clientes ou tabela de contratos
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  // --- Estado tabela de contratos ---
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date-desc")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  // --- Estado grade de clientes ---
  const [gridSearch, setGridSearch] = useState("")
  const [segmentFilter, setSegmentFilter] = useState<RfvSegment | "Todos">("Todos")
  const [gridSortBy, setGridSortBy] = useState<"score" | "value" | "name" | "date">("score")
  const [selectedClient, setSelectedClient] = useState<ClientRfv | null>(null)

  // Computa RFV a partir dos contratos
  const clientsRfv = useMemo(() => computeClientsRfv(contracts), [contracts])

  // Filtra tabela de contratos
  const filteredContracts = useMemo(() => {
    let result = [...contracts]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.client_name.toLowerCase().includes(q) || c.product.toLowerCase().includes(q)
      )
    }
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter)
    if (brandFilter) result = result.filter((c) => c.brand === brandFilter)
    if (dateFrom) result = result.filter((c) => c.purchase_date >= dateFrom)
    if (dateTo) result = result.filter((c) => c.purchase_date <= dateTo)
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.purchase_date.localeCompare(a.purchase_date)
        case "date-asc": return a.purchase_date.localeCompare(b.purchase_date)
        case "value-desc": return Number(b.value) - Number(a.value)
        case "value-asc": return Number(a.value) - Number(b.value)
        case "client-asc": return a.client_name.localeCompare(b.client_name, "pt-BR")
        default: return 0
      }
    })
    return result
  }, [contracts, search, categoryFilter, brandFilter, sortBy, dateFrom, dateTo])

  // Unique clients count
  const uniqueClients = useMemo(
    () => new Set(contracts.map((c) => c.client_name)).size,
    [contracts]
  )

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {uniqueClients} clientes na base &bull; Análise RFV completa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
              title="Vista em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
              title="Vista em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleNewContract}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* KPI Cards — sempre com base nos dados completos */}
      <ClientsKpiCards contracts={contracts} />

      {viewMode === "grid" ? (
        /* ---- GRADE DE CLIENTES RFV ---- */
        <ClientsGrid
          clients={clientsRfv}
          segmentFilter={segmentFilter}
          onSegmentChange={setSegmentFilter}
          search={gridSearch}
          onSearchChange={setGridSearch}
          sortBy={gridSortBy}
          onSortChange={setGridSortBy}
          onClientClick={setSelectedClient}
        />
      ) : (
        /* ---- TABELA DE CONTRATOS ---- */
        <>
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
          <p className="text-sm text-muted-foreground mb-3">
            {filteredContracts.length === contracts.length
              ? `${filteredContracts.length} contratos`
              : `${filteredContracts.length} de ${contracts.length} contratos`}
          </p>
          <ContractsTable contracts={filteredContracts} onEdit={handleEdit} />
        </>
      )}

      {/* Modal de detalhe do cliente */}
      <ClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* Dialog de criar/editar contrato */}
      <ContractDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        contract={editingContract}
      />
    </div>
  )
}
