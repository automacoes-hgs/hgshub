import { Card, CardContent } from "@/components/ui/card"
import type { ClientHealth } from "@/lib/health"
import { HEALTH_STATUS_CONFIG } from "@/lib/health"
import { cn } from "@/lib/utils"

interface HealthSectionRealProps {
  clientsHealth: ClientHealth[]
}

export function HealthSectionReal({ clientsHealth }: HealthSectionRealProps) {
  const healthy = clientsHealth.filter((c) => c.status === "Saudável")
  const attention = clientsHealth.filter((c) => c.status === "Atenção")
  const risk = clientsHealth.filter((c) => c.status === "Em Risco")
  const total = clientsHealth.length || 1

  const pctHealthy = Math.round((healthy.length / total) * 100)
  const pctAttention = Math.round((attention.length / total) * 100)
  const pctRisk = Math.round((risk.length / total) * 100)

  const groups = [
    { label: "Saudável", count: healthy.length, pct: pctHealthy, cfg: HEALTH_STATUS_CONFIG["Saudável"] },
    { label: "Atenção",  count: attention.length, pct: pctAttention, cfg: HEALTH_STATUS_CONFIG["Atenção"] },
    { label: "Em Risco", count: risk.length, pct: pctRisk, cfg: HEALTH_STATUS_CONFIG["Em Risco"] },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        {groups.map((g) => (
          <Card key={g.label} className="border-border bg-card">
            <CardContent className="pt-5 pb-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{g.label}</span>
                <span className={cn("h-2 w-2 rounded-full", g.cfg.dot)} />
              </div>
              <p className={cn("text-3xl font-bold tracking-tight", g.cfg.text)}>{g.count}</p>
              <p className="text-xs text-muted-foreground">{g.pct}% da base</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de distribuição */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        {pctHealthy > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${pctHealthy}%` }} />}
        {pctAttention > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${pctAttention}%` }} />}
        {pctRisk > 0 && <div className="bg-red-500 transition-all" style={{ width: `${pctRisk}%` }} />}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{pctHealthy}% saudável</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{pctAttention}% atenção</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{pctRisk}% em risco</span>
      </div>
    </div>
  )
}
