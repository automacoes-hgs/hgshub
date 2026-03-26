import { AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormMessageProps {
  type: "error" | "success"
  message: string
  className?: string
}

export function FormMessage({ type, message, className }: FormMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        type === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-green-500/30 bg-green-500/5 text-green-700",
        className
      )}
    >
      {type === "error" ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="leading-relaxed">{message}</p>
    </div>
  )
}
