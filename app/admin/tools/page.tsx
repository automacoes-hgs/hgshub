import Link from "next/link"
import { BarChart2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ToolsPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Link href="/admin/tools/bdr">
        <Card className="border-border bg-card hover:border-blue-500 transition-colors cursor-pointer group">
          <CardContent className="pt-6 pb-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                Acompanhamento de BDR
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoramento de performance, metas e lançamentos diários da equipe comercial.
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
