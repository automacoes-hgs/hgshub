import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Relatórios
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize dados e métricas do sistema.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Análises
          </CardTitle>
          <CardDescription>
            Esta seção será expandida com relatórios personalizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">
              Em breve
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
              Relatórios detalhados e gráficos de desempenho estarão disponíveis aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
