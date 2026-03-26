import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import type { HealthAlert } from "@/lib/health"
import { cn } from "@/lib/utils"

interface ChurnAlertsRealProps {
  alerts: HealthAlert[]
}

const ALERT_STYLES = {
  danger:  { row: "border-l-2 border-red-500 bg-red-50 dark:bg-red-950/20",    text: "text-red-700 dark:text-red-400",    icon: AlertTriangle },
  warning: { row: "border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", icon: AlertCircle },
  info:    { row: "border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20",  text: "text-blue-700 dark:text-blue-400",   icon: Info },
}

export function ChurnAlertsReal({ alerts }: ChurnAlertsRealProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum alerta ativo no momento.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {alerts.length} alerta{alerts.length !== 1 ? "s" : ""} ativo{alerts.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {alerts.slice(0, 10).map((alert, i) => {
          const s = ALERT_STYLES[alert.type]
          const Icon = s.icon
          return (
            <div key={i} className={cn("flex items-start gap-3 rounded-md px-3 py-2.5 text-sm", s.row)}>
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", s.text)} />
              <span className={cn("leading-relaxed", s.text)}>{alert.message}</span>
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
