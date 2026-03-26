"use client"

import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react"
import type { HealthAlert } from "@/lib/health"

type Props = {
  alerts: HealthAlert[]
}

const ALERT_CONFIG = {
  danger: {
    icon: AlertCircle,
    iconColor: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "Crítico",
    labelColor: "text-red-700",
    labelBg: "bg-red-100",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Atenção",
    labelColor: "text-amber-700",
    labelBg: "bg-amber-100",
  },
  info: {
    icon: Info,
    iconColor: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
    label: "Aviso",
    labelColor: "text-orange-700",
    labelBg: "bg-orange-100",
  },
}

export function QualityAlerts({ alerts }: Props) {
  const danger  = alerts.filter((a) => a.type === "danger").length
  const warning = alerts.filter((a) => a.type === "warning").length
  const info    = alerts.filter((a) => a.type === "info").length

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Alertas</h2>
          {alerts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
              {alerts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {danger > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {danger} crítico{danger > 1 ? "s" : ""}
            </span>
          )}
          {warning > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {warning} atenção
            </span>
          )}
          {info > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              {info} aviso{info > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          </div>
        ) : (
          alerts.map((alert, i) => {
            const cfg = ALERT_CONFIG[alert.type]
            const Icon = cfg.icon
            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors`}
              >
                <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{alert.message}</p>
                </div>
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.labelBg} ${cfg.labelColor}`}>
                  {cfg.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
