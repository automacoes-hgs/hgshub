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
            <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
              <span className={cn("h-2.5 w-2.5 rounded-full mb-1", g.cfg.dot)} />
              <p className="text-2xl font-bold text-foreground">{g.count}</p>
              <p className="text-xs text-muted-foreground">{g.label}</p>
              <p className={cn("text-xs font-medium", g.cfg.text)}>{g.pct}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de distribuição */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted">
        {pctHealthy > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${pctHealthy}%` }} />}
        {pctAttention > 0 && <div className="bg-amber-400 transition-all" style={{ width: `${pctAttention}%` }} />}
        {pctRisk > 0 && <div className="bg-red-500 transition-all" style={{ width: `${pctRisk}%` }} />}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-emerald-600">{pctHealthy}% saudável</span>
        <span className="text-amber-500">{pctAttention}% atenção</span>
        <span className="text-red-500">{pctRisk}% em risco</span>
      </div>
    </div>
  )
}
