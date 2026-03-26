"use client"

type Props = {
  value: number   // 1–5
  label: string
}

// Color por faixa de valor
function gaugeColor(value: number) {
  if (value >= 4) return { stroke: "#10b981", text: "#10b981" } // emerald
  if (value >= 3) return { stroke: "#f59e0b", text: "#f59e0b" } // amber
  return { stroke: "#ef4444", text: "#ef4444" }                  // red
}

export function RfvGauge({ value, label }: Props) {
  const { stroke, text } = gaugeColor(value)
  // SVG arc para gauge semicircular
  const radius = 36
  const cx = 50
  const cy = 52
  const startAngle = -180
  const totalDeg = 180
  const fillDeg = (value / 5) * totalDeg

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToCartesian(cx, cy, r, startDeg)
    const e = polarToCartesian(cx, cy, r, endDeg)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  // start = -90 (left), end up to +90 (right) → 180° sweep
  const bgStart = -90
  const bgEnd = 90
  const fgEnd = -90 + fillDeg

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center w-full">
        <svg viewBox="0 0 100 60" className="w-24 h-14">
          {/* Track */}
          <path
            d={arcPath(cx, cy, radius, bgStart, bgEnd)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={arcPath(cx, cy, radius, bgStart, fgEnd)}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill={text}
          >
            {value}.0
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fontSize="7"
            fill="#94a3b8"
          >
            de 5
          </text>
        </svg>
        <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
      </div>
    </div>
  )
}
