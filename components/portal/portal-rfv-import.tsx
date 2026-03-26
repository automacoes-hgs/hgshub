"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download, Loader2, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { fmtValue, PAYMENT_LABELS } from "@/lib/rfv-portal"
import type { Product } from "./portal-rfv-client"
import type { PortalRfvEntry } from "@/lib/rfv-portal"

// ─── Tipos ───────────────────────────────────────────────────────────────────
type ImportType = "produto" | "servico"

export type RawRow = {
  customer_name: string
  product_name: string
  value: number
  purchase_date: string            // YYYY-MM-DD
  payment_method: string
  notes?: string
  // Apenas para produto:
  qty?: number
  unit_price?: number
}

type ParsedRow = RawRow & {
  _line: number
  _errors: string[]
  _valid: boolean
  _computedValue: number           // qty * unit_price para produto; value para serviço
}

type ImportState = "idle" | "preview" | "importing" | "done"

interface Props {
  ownerId: string
  products: Product[]
  open: boolean
  onClose: () => void
  onImported: (entries: PortalRfvEntry[], newProducts: Product[]) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PAYMENT_ALIASES: Record<string, string> = {
  pix: "pix", "pix": "pix",
  boleto: "boleto",
  "cartao credito": "cartao_credito", "cartão crédito": "cartao_credito",
  "cartao_credito": "cartao_credito", "credit card": "cartao_credito",
  "cartao debito": "cartao_debito", "cartão débito": "cartao_debito",
  "cartao_debito": "cartao_debito",
  "transferencia": "transferencia", "transferência": "transferencia", "ted": "transferencia",
  outros: "outros", other: "outros", "": "outros",
}

function normalizePayment(raw: string): string {
  const key = raw.trim().toLowerCase()
  return PAYMENT_ALIASES[key] ?? "outros"
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  // Tenta DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY
  const clean = raw.trim()
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null
  if (iso) return iso
  const br = clean.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const us = clean.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (us) return null // ambiguous
  // Tenta Date.parse como fallback
  const d = new Date(clean)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")
  if (lines.length < 2) return []
  const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/["']/g, ""))
  return lines.slice(1).map((line) => {
    const values = line.split(/[,;]/).map((v) => v.trim().replace(/^["']|["']$/g, ""))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? "" })
    return obj
  }).filter((r) => Object.values(r).some((v) => v))
}

function parseJson(text: string): Record<string, string>[] {
  try {
    const parsed = JSON.parse(text)
    const arr = Array.isArray(parsed) ? parsed : parsed.data ?? parsed.rows ?? []
    return arr.map((item: unknown) => {
      const row: Record<string, string> = {}
      if (typeof item === "object" && item !== null) {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          row[k.toLowerCase()] = String(v ?? "")
        }
      }
      return row
    })
  } catch {
    return []
  }
}

// Mapeamento flexível de nomes de colunas
const COLUMN_ALIASES: Record<keyof RawRow, string[]> = {
  customer_name:  ["customer_name", "cliente", "nome", "nome do cliente", "client", "name", "customer"],
  product_name:   ["product_name", "produto", "produto/serviço", "produto serviço", "servico", "serviço", "service", "product", "item", "descricao", "descrição"],
  value:          ["value", "valor", "total", "valor total", "amount", "preco", "preço"],
  purchase_date:  ["purchase_date", "data", "data da compra", "data compra", "date", "data venda"],
  payment_method: ["payment_method", "pagamento", "forma de pagamento", "metodo", "método", "payment", "forma pagamento"],
  notes:          ["notes", "obs", "observacao", "observação", "observacoes", "nota", "note", "remark"],
  qty:            ["qty", "quantidade", "quant", "quantity", "qtd"],
  unit_price:     ["unit_price", "valor unitario", "valor unitário", "preco unitario", "preco unit", "unit", "vl unitario"],
}

function resolveColumn(row: Record<string, string>, field: keyof RawRow): string {
  const aliases = COLUMN_ALIASES[field]
  for (const alias of aliases) {
    if (row[alias] !== undefined) return row[alias]
  }
  return ""
}

function parseAndValidateRow(raw: Record<string, string>, index: number, type: ImportType): ParsedRow {
  const errors: string[] = []

  const customer_name = resolveColumn(raw, "customer_name").trim()
  if (!customer_name) errors.push("Nome do cliente obrigatório")

  const product_name = resolveColumn(raw, "product_name").trim()
  if (!product_name) errors.push("Produto/serviço obrigatório")

  const rawDate = resolveColumn(raw, "purchase_date")
  const purchase_date = parseDate(rawDate) ?? ""
  if (!purchase_date) errors.push(`Data inválida: "${rawDate}"`)

  const rawValue = resolveColumn(raw, "value").replace(",", ".")
  const value = parseFloat(rawValue) || 0

  const payment_method = normalizePayment(resolveColumn(raw, "payment_method"))
  const notes = resolveColumn(raw, "notes") || undefined

  let qty: number | undefined
  let unit_price: number | undefined
  let computedValue = value

  if (type === "produto") {
    const rawQty = resolveColumn(raw, "qty").replace(",", ".")
    const rawUnit = resolveColumn(raw, "unit_price").replace(",", ".")
    qty = parseFloat(rawQty) || undefined
    unit_price = parseFloat(rawUnit) || undefined
    if (qty && unit_price) {
      computedValue = qty * unit_price
    } else if (!value && (!qty || !unit_price)) {
      errors.push("Para produto: informe (qty + unit_price) ou valor total")
    }
  } else {
    if (!value) errors.push("Valor obrigatório para serviço")
  }

  return {
    customer_name, product_name, value, purchase_date, payment_method, notes,
    qty, unit_price,
    _line: index + 2,
    _errors: errors,
    _valid: errors.length === 0,
    _computedValue: computedValue,
  }
}

// ─── Componente de importação ─────────────────────────────────────────────────
export function PortalRfvImport({ ownerId, products, open, onClose, onImported }: Props) {
  const supabase = createClient()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [importType, setImportType] = useState<ImportType>("servico")
  const [state, setState] = useState<ImportState>("idle")
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const validRows = rows.filter((r) => r._valid)
  const invalidRows = rows.filter((r) => !r._valid)

  function reset() {
    setState("idle"); setRows([]); setFileName(""); setProgress(0)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleClose() { reset(); onClose() }

  function processFile(file: File) {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rawRows = file.name.endsWith(".json") ? parseJson(text) : parseCsv(text)
      if (!rawRows.length) {
        toast({ title: "Arquivo vazio ou inválido", variant: "destructive" }); return
      }
      const parsed = rawRows.map((r, i) => parseAndValidateRow(r, i, importType))
      setRows(parsed)
      setState("preview")
    }
    reader.readAsText(file, "UTF-8")
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [importType])

  // ── Import em lotes ───────────────────────────────────────────────────────
  async function handleImport() {
    if (!validRows.length) return
    setState("importing")

    try {
      // 1. Descobrir quais product_names já existem no catálogo
      const productMap = new Map<string, string>() // name.lower → id
      for (const p of products) productMap.set(p.name.toLowerCase(), p.id)

      // 2. Coletar product_names únicos que ainda não existem
      const uniqueNewProducts = Array.from(
        new Set(
          validRows
            .map((r) => r.product_name.toLowerCase())
            .filter((n) => !productMap.has(n))
        )
      )

      const newProducts: Product[] = []

      if (uniqueNewProducts.length) {
        // Criar produtos em lote
        const toInsert = uniqueNewProducts.map((name) => {
          const sample = validRows.find((r) => r.product_name.toLowerCase() === name)
          return {
            owner_id: ownerId,
            name: sample!.product_name.trim(),
            price: importType === "produto"
              ? (sample?.unit_price ?? sample?._computedValue ?? 0)
              : sample!._computedValue,
            is_active: true,
          }
        })

        const { data: created, error } = await supabase
          .from("client_products")
          .insert(toInsert)
          .select()

        if (error) throw new Error(`Erro ao criar produtos: ${error.message}`)

        for (const p of (created ?? [])) {
          productMap.set(p.name.toLowerCase(), p.id)
          newProducts.push(p as Product)
        }
      }

      // 3. Preparar entradas em lotes de 50
      const CHUNK = 50
      const allInserted: PortalRfvEntry[] = []

      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK)
        const payload = chunk.map((r) => ({
          owner_id: ownerId,
          customer_name: r.customer_name,
          product_id: productMap.get(r.product_name.toLowerCase()) ?? null,
          product_name: r.product_name,
          value: r._computedValue,
          payment_method: r.payment_method,
          purchase_date: r.purchase_date,
          notes: r.notes ?? null,
        }))

        const { data, error } = await supabase
          .from("client_rfv_entries")
          .insert(payload)
          .select()

        if (error) throw new Error(`Erro no lote ${Math.floor(i / CHUNK) + 1}: ${error.message}`)
        allInserted.push(...(data ?? []))
        setProgress(Math.round(((i + chunk.length) / validRows.length) * 100))
      }

      setState("done")
      onImported(allInserted, newProducts)
      toast({
        title: `${allInserted.length} transações importadas`,
        description: uniqueNewProducts.length
          ? `${uniqueNewProducts.length} novo(s) produto(s) criado(s) automaticamente.`
          : "Todos os produtos já existiam no catálogo.",
      })
    } catch (err) {
      toast({ title: "Erro na importação", description: String(err), variant: "destructive" })
      setState("preview")
    }
  }

  // ── Template download ─────────────────────────────────────────────────────
  function downloadTemplate() {
    const headers =
      importType === "produto"
        ? "cliente,produto,qty,valor_unitario,valor,data,pagamento,observacoes"
        : "cliente,produto,valor,data,pagamento,observacoes"
    const example =
      importType === "produto"
        ? 'João Silva,Produto A,2,500.00,1000.00,2024-03-15,pix,'
        : 'João Silva,Consultoria Mensal,2500.00,2024-03-15,transferencia,'
    const blob = new Blob([`${headers}\n${example}\n`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `template-importacao-${importType}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Transações</DialogTitle>
          <DialogDescription>
            Importe clientes em massa via arquivo CSV ou JSON. Produtos inexistentes serão criados automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* ── Tipo de importação ── */}
        <div className="flex gap-2">
          {(["servico", "produto"] as ImportType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setImportType(t); reset() }}
              className={cn(
                "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all",
                importType === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {t === "produto" ? "Produto (com Qtd. e Valor Unit.)" : "Serviço (apenas Valor Total)"}
            </button>
          ))}
        </div>

        {/* ── Colunas esperadas ── */}
        <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1.5">Colunas esperadas:</p>
          <div className="flex flex-wrap gap-1.5">
            {["cliente", "produto", "valor", "data", "pagamento"].map((c) => (
              <code key={c} className="bg-background border border-border rounded px-1.5 py-0.5">{c}</code>
            ))}
            {importType === "produto" && (
              <>
                <code className="bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 text-primary">qty</code>
                <code className="bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 text-primary">valor_unitario</code>
              </>
            )}
            <code className="bg-background border border-border rounded px-1.5 py-0.5">observacoes</code>
          </div>
          <p className="mt-2 text-muted-foreground/70">
            Aceita nomes em português ou inglês. Data: DD/MM/YYYY ou YYYY-MM-DD. Pagamento: pix, boleto, transferencia, cartao_credito, cartao_debito.
          </p>
        </div>

        {state === "idle" && (
          <>
            {/* ── Drop zone ── */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all",
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <div className={cn("p-3 rounded-full transition-colors", isDragOver ? "bg-primary/10" : "bg-muted")}>
                <Upload className={cn("h-6 w-6 transition-colors", isDragOver ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">CSV ou JSON — sem limite de linhas</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={onFileChange} />
            </div>

            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 self-start">
              <Download className="h-4 w-4" /> Baixar template {importType === "produto" ? "de produto" : "de serviço"}
            </Button>
          </>
        )}

        {/* ── Preview ── */}
        {state === "preview" && (
          <div className="space-y-3">
            {/* Resumo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">{validRows.length} válidas</span>
              </div>
              {invalidRows.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{invalidRows.length} com erros</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{fileName}</span>
            </div>

            {/* Erros */}
            {invalidRows.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-red-700 mb-1">Linhas com erros (serão ignoradas):</p>
                {invalidRows.map((r) => (
                  <div key={r._line} className="text-xs text-red-600 flex gap-2">
                    <span className="font-mono shrink-0">Linha {r._line}:</span>
                    <span>{r._errors.join(" | ")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabela de preview */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Cliente</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Produto/Serviço</th>
                      {importType === "produto" && (
                        <>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Qtd</th>
                          <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Vl. Unit.</th>
                        </>
                      )}
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Total</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Data</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Pagamento</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r._line}
                        className={cn("border-b border-border/50", r._valid ? "" : "bg-red-50/50")}
                      >
                        <td className="px-3 py-2 font-medium">{r.customer_name || <span className="text-red-500 italic">vazio</span>}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.product_name || <span className="text-red-500 italic">vazio</span>}</td>
                        {importType === "produto" && (
                          <>
                            <td className="px-3 py-2 text-right">{r.qty ?? "—"}</td>
                            <td className="px-3 py-2 text-right">{r.unit_price ? fmtValue(r.unit_price) : "—"}</td>
                          </>
                        )}
                        <td className="px-3 py-2 text-right font-semibold">{fmtValue(r._computedValue)}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.purchase_date
                            ? new Date(r.purchase_date + "T00:00:00").toLocaleDateString("pt-BR")
                            : <span className="text-red-500 italic">inválida</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{PAYMENT_LABELS[r.payment_method] ?? r.payment_method}</td>
                        <td className="px-3 py-2 text-center">
                          {r._valid
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                            : <AlertCircle className="h-3.5 w-3.5 text-red-500 mx-auto" title={r._errors.join(", ")} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <X className="h-3 w-3" /> Trocar arquivo
            </button>
          </div>
        )}

        {/* ── Progresso ── */}
        {state === "importing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Importando {validRows.length} transações...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Concluído ── */}
        {state === "done" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="p-3 rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-base font-semibold text-foreground">Importação concluída!</p>
            <p className="text-sm text-muted-foreground">{validRows.length} transações adicionadas com sucesso.</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {state === "done" ? "Fechar" : "Cancelar"}
          </Button>
          {state === "preview" && (
            <Button onClick={handleImport} disabled={validRows.length === 0} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar {validRows.length} linha{validRows.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
