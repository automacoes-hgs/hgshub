"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Config = {
  recency: [number, number, number, number]    // dias máx para scores 5,4,3,2 (1 = acima do 4º)
  frequency: [number, number, number, number]  // nº mín de contratos para scores 5,4,3,2
  monetary: [number, number, number, number]   // valor mín (R$) para scores 5,4,3,2
}

const DEFAULT_CONFIG: Config = {
  recency:   [30, 90, 180, 365],
  frequency: [10, 6, 3, 2],
  monetary:  [200000, 80000, 30000, 10000],
}

const LS_KEY = "hgs_rfv_config"

function loadConfig(): Config {
  if (typeof window === "undefined") return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG
  } catch { return DEFAULT_CONFIG }
}

function saveConfig(config: Config) {
  localStorage.setItem(LS_KEY, JSON.stringify(config))
}

export function RfvConfig() {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const { toast } = useToast()

  function handleOpen() {
    if (!open) setConfig(loadConfig())
    setOpen(!open)
  }

  function update<K extends keyof Config>(key: K, idx: number, val: string) {
    const parsed = Number(val.replace(/\D/g, ""))
    setConfig((prev) => {
      const arr = [...prev[key]] as [number, number, number, number]
      arr[idx] = isNaN(parsed) ? 0 : parsed
      return { ...prev, [key]: arr }
    })
  }

  function handleSave() {
    saveConfig(config)
    toast({ title: "Configuração salva", description: "As faixas RFV foram salvas localmente." })
  }

  function handleRecalculate() {
    toast({ title: "Funcionalidade em desenvolvimento", description: "O recálculo automático de scores será disponibilizado em breve." })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">Configuração RFV</p>
          <p className="text-xs text-muted-foreground mt-0.5">Configure as faixas de score para segmentação automática</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recência */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Recência (dias desde o último contrato)</p>
              <div className="flex flex-col gap-2">
                {([5, 4, 3, 2] as const).map((score, i) => (
                  <div key={score} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">Score {score}:</span>
                    <span className="text-xs text-muted-foreground shrink-0">até</span>
                    <input
                      type="number"
                      value={config.recency[i]}
                      onChange={(e) => update("recency", i, e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">dias</span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground mt-1">Score 1: acima de {config.recency[3]} dias</p>
              </div>
            </div>

            {/* Frequência */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Frequência (nº de contratos)</p>
              <div className="flex flex-col gap-2">
                {([5, 4, 3, 2] as const).map((score, i) => (
                  <div key={score} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">Score {score}:</span>
                    <span className="text-xs text-muted-foreground shrink-0">≥</span>
                    <input
                      type="number"
                      value={config.frequency[i]}
                      onChange={(e) => update("frequency", i, e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">contratos</span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground mt-1">Score 1: apenas 1 contrato</p>
              </div>
            </div>

            {/* Monetário */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Monetário (valor total R$)</p>
              <div className="flex flex-col gap-2">
                {([5, 4, 3, 2] as const).map((score, i) => (
                  <div key={score} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">Score {score}:</span>
                    <span className="text-xs text-muted-foreground shrink-0">≥ R$</span>
                    <input
                      type="number"
                      value={config.monetary[i]}
                      onChange={(e) => update("monetary", i, e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground mt-1">Score 1: abaixo de R$ {config.monetary[3].toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Salvar Configuração
            </button>
            <button
              onClick={handleRecalculate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Recalcular Scores
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
