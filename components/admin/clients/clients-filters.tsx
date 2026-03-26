"use client"

import { Search, ChevronDown, Check, Calendar } from "lucide-react"
import { CATEGORIES, BRANDS } from "@/lib/types/contracts"
import type { Brand } from "@/lib/types/contracts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortOption = "date-desc" | "date-asc" | "value-desc" | "value-asc" | "client-asc"

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Data: mais recente",
  "date-asc": "Data: mais antiga",
  "value-desc": "Valor: maior",
  "value-asc": "Valor: menor",
  "client-asc": "Cliente: A-Z",
}

type Props = {
  search: string
  onSearchChange: (v: string) => void
  categoryFilter: string
  onCategoryChange: (v: string) => void
  brandFilter: string
  onBrandChange: (v: string) => void
  sortBy: SortOption
  onSortChange: (v: SortOption) => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
}

export function ClientsFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  brandFilter,
  onBrandChange,
  sortBy,
  onSortChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-3">
      {/* Row 1: search + dropdowns */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou produto..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground hover:bg-muted transition-colors min-w-[160px]">
            <span className="flex-1 text-left">{categoryFilter || "Todas as categorias"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuItem onClick={() => onCategoryChange("")}>
              <span className="flex-1">Todas as categorias</span>
              {!categoryFilter && <Check className="h-4 w-4 ml-2 text-blue-600" />}
            </DropdownMenuItem>
            {CATEGORIES.map((cat) => (
              <DropdownMenuItem key={cat.name} onClick={() => onCategoryChange(cat.name)}>
                <span className="flex-1 font-medium">{cat.name}</span>
                <span className="text-muted-foreground text-xs mr-2">Ciclo: {cat.cycleDays} dias</span>
                {categoryFilter === cat.name && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Brand filter */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground hover:bg-muted transition-colors min-w-[140px]">
            <span className="flex-1 text-left">{brandFilter || "Todas as marcas"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => onBrandChange("")}>
              <span className="flex-1">Todas as marcas</span>
              {!brandFilter && <Check className="h-4 w-4 ml-2 text-blue-600" />}
            </DropdownMenuItem>
            {BRANDS.map((brand) => (
              <DropdownMenuItem key={brand} onClick={() => onBrandChange(brand)}>
                <span className="flex-1">{brand}</span>
                {brandFilter === brand && <Check className="h-4 w-4 ml-2 text-blue-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground hover:bg-muted transition-colors min-w-[170px]">
            <span className="flex-1 text-left">{SORT_LABELS[sortBy]}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <DropdownMenuItem key={opt} onClick={() => onSortChange(opt)}>
                <span className="flex-1">{SORT_LABELS[opt]}</span>
                {sortBy === opt && <Check className="h-4 w-4 ml-2 text-blue-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 2: period */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="font-medium text-foreground">Período:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-2 py-1 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span>até</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-2 py-1 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}
