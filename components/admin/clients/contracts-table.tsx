"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Trash2, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Contract } from "@/lib/types/contracts"
import { getContractStatus, getDaysRemaining, getCycleDays, CATEGORIES } from "@/lib/types/contracts"
import { deleteContract } from "@/app/admin/clients/actions"

type Props = {
  contracts: Contract[]
  onEdit: (contract: Contract) => void
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function CycleBar({ contract }: { contract: Contract }) {
  const cycleDays = getCycleDays(contract)
  const daysRemaining = getDaysRemaining(contract)
  const status = getContractStatus(contract)
  const isExpired = status === "Expirado"
  const progress = isExpired
    ? 100
    : Math.max(0, Math.min(100, ((cycleDays - daysRemaining) / cycleDays) * 100))

  const isCustomCycle =
    contract.custom_end_date !== null ||
    (() => {
      const cat = CATEGORIES.find((c) => c.name === contract.category)
      return cat ? cat.cycleDays !== cycleDays : false
    })()

  return (
    <div className="min-w-[120px]">
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all ${isExpired ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className={`text-xs ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
        {isExpired
          ? `Vencido há ${Math.abs(daysRemaining)} dias`
          : `${daysRemaining} dias restantes`}
      </p>
    </div>
  )
}

function StatusBadge({ contract }: { contract: Contract }) {
  const status = getContractStatus(contract)
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        status === "Ativo"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {status}
    </span>
  )
}

export function ContractsTable({ contracts, onEdit }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return
    setDeletingId(id)
    await deleteContract(id)
    setDeletingId(null)
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-sm">Nenhum contrato encontrado.</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoria</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Produto</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Data</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Valor</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ciclo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => {
              const cycleDays = getCycleDays(contract)
              const hasCustomCycle = contract.custom_end_date !== null

              return (
                <tr
                  key={contract.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${
                    deletingId === contract.id ? "opacity-50" : ""
                  }`}
                >
                  {/* Cliente */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{contract.client_name}</span>
                      {contract.has_bonus && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{contract.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasCustomCycle
                        ? `Ciclo personalizado: ${cycleDays} dias`
                        : `Ciclo: ${cycleDays} dias`}
                    </p>
                  </td>

                  {/* Produto */}
                  <td className="px-4 py-3 text-foreground">{contract.product}</td>

                  {/* Data */}
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {formatDate(contract.purchase_date)}
                  </td>

                  {/* Valor */}
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {formatCurrency(Number(contract.value))}
                  </td>

                  {/* Ciclo (barra) */}
                  <td className="px-4 py-3">
                    <CycleBar contract={contract} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge contract={contract} />
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(contract)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
