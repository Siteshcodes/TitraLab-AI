/**
 * TitrationCurve — live pH-vs-volume plot that builds up as the student adds
 * NaOH (the "Part A" method from the reference manual). Pure presentational:
 * it just plots the points it is given. The steep jump near the endpoint
 * appears naturally from the pH model — no spoilers, the student discovers it.
 */

const Y_MAX = 14
const W = 360
const H = 200
const M = { t: 14, r: 14, b: 30, l: 32 }
const PW = W - M.l - M.r
const PH = H - M.t - M.b

export default function TitrationCurve({ points = [], highlight = false }) {
  const lastV = points.length ? points[points.length - 1].v : 0
  // X axis grows in 4 mL steps; starts at 12 (endpoint 10 + headroom).
  const xMax = Math.max(12, Math.ceil(lastV / 4) * 4)

  const sx = (v) => M.l + (Math.min(v, xMax) / xMax) * PW
  const sy = (ph) => M.t + (1 - ph / Y_MAX) * PH

  const poly = points.map((p) => `${sx(p.v).toFixed(1)},${sy(p.ph).toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  const yLines = [0, 2, 4, 6, 8, 10, 12, 14]
  const xTicks = []
  for (let v = 0; v <= xMax; v += 4) xTicks.push(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Titration curve: pH versus volume of NaOH added">
      {/* plot background */}
      <rect x={M.l} y={M.t} width={PW} height={PH} fill="#f8fafc" rx="6" />

      {/* horizontal gridlines */}
      {yLines.map((ph) => (
        <line
          key={ph}
          x1={M.l}
          x2={M.l + PW}
          y1={sy(ph)}
          y2={sy(ph)}
          stroke={ph === 7 ? '#cbd5e1' : '#eef2f6'}
          strokeWidth={ph === 7 ? 1.2 : 1}
          strokeDasharray={ph === 7 ? '4 3' : undefined}
        />
      ))}

      {/* y labels (0, 7, 14) */}
      {[0, 7, 14].map((ph) => (
        <text key={ph} x={M.l - 6} y={sy(ph) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
          {ph}
        </text>
      ))}
      <text
        x="9"
        y={M.t + PH / 2}
        fontSize="9"
        fill="#64748b"
        textAnchor="middle"
        transform={`rotate(-90 9 ${M.t + PH / 2})`}
      >
        pH
      </text>

      {/* x ticks + labels */}
      {xTicks.map((v) => (
        <g key={v}>
          <line x1={sx(v)} x2={sx(v)} y1={M.t + PH} y2={M.t + PH + 3} stroke="#cbd5e1" />
          <text x={sx(v)} y={M.t + PH + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {v}
          </text>
        </g>
      ))}
      <text x={M.l + PW / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#64748b">
        NaOH added (mL)
      </text>

      {/* empty-state hint (only the starting point present) */}
      {points.length <= 1 && (
        <text
          x={M.l + PW / 2}
          y={M.t + PH / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#cbd5e1"
        >
          Add NaOH to plot the curve →
        </text>
      )}

      {/* the curve */}
      {points.length > 1 && (
        <polyline
          points={poly}
          fill="none"
          stroke={highlight ? '#e0218a' : '#3b82f6'}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* measured points */}
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.v)} cy={sy(p.ph)} r="1.8" fill={highlight ? '#e0218a' : '#60a5fa'} />
      ))}

      {/* current point, emphasised */}
      {last && (
        <circle
          cx={sx(last.v)}
          cy={sy(last.ph)}
          r="4"
          fill={highlight ? '#e0218a' : '#2563eb'}
          stroke="#fff"
          strokeWidth="1.5"
        />
      )}
    </svg>
  )
}
