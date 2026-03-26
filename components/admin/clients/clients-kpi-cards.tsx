"use client"

import type { Contract } from "@/lib/types/contracts"

type Props = {
  contracts: Contract[]
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ClientsKpiCards({ contracts }: Props) {
  const totalContracts = contracts.length
  const uniqueClients = new Set(contracts.map((c) => c.client_name.toLowerCase())).size
  const totalValue = contracts.reduce((sum, c) => sum + Number(c.value), 0)
  const ticketMedio = totalContracts > 0 ? totalValue / totalContracts : 0

  const cards = [
    {
      label: "Total de Contratos",
      value: totalContracts.toString(),
      highlight: false,
    },
    {
      label: "Clientes Únicos",
      value: uniqueClients.toString(),
      highlight: false,
    },
    {
      label: "Valor Total",
      value: formatCurrency(totalValue),
      highlight: true,
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(ticketMedio),
      highlight: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-lg p-4"
        >
          <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
          <p
            className={`text-2xl font-bold ${
              card.highlight ? "text-blue-600" : "text-foreground"
            }`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
