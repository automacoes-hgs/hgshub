import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import type { HealthAlert } from "@/lib/health"
import { cn } from "@/lib/utils"

interface ChurnAlertsRealProps {
  alerts: HealthAlert[]
}

const ALERT_STYLES = {
  danger:  { row: "bg-red-900/40 text-red-300",    dot: "bg-red-500" },
  warning: { row: "bg-amber-900/30 text-amber-300", dot: "bg-amber-400" },
  info:    { row: "bg-blue-900/30 text-blue-300",   dot: "bg-blue-400" },
}

export function ChurnAlertsReal({ alerts }: ChurnAlertsRealProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Nenhum alerta ativo no momento.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-800/60 bg-red-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          {alerts.length} alerta{alerts.length !== 1 ? "s" : ""} ativo{alerts.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.slice(0, 10).map((alert, i) => {
          const s = ALERT_STYLES[alert.type]
          return (
            <div key={i} className={cn("flex items-start gap-3 rounded-md px-3 py-2 text-sm", s.row)}>
              <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1", s.dot)} />
              <span>{alert.message}</span>
            </div>
          )
        })}
        {alerts.length > 10 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{alerts.length - 10} alerta{alerts.length - 10 !== 1 ? "s" : ""} adicionais
          </p>
        )}
      </CardContent>
    </Card>
  )
}
