/**
 * Apparatus — retort stand + burette + conical (Erlenmeyer) flask, drawn as a
 * single SVG so the burette tip always lines up over the flask mouth.
 *
 * Props (all prop-driven so Step 2's simulation can animate it):
 *   buretteFraction : 0..1   how much titrant (NaOH) is left in the burette
 *   flaskColor      : css color string for the flask liquid (the indicator color)
 *   flaskFraction   : 0..1   how full the flask is
 *   dripping        : bool    show a falling drop at the tip (visual flourish)
 */

// Burette interior geometry (used to map fraction -> liquid level)
const B_TOP = 74
const B_BOTTOM = 346
// Flask body interior geometry
const F_TOP = 452
const F_BOTTOM = 497

const GRADS = [0, 10, 20, 30, 40, 50]

export default function Apparatus({
  buretteFraction = 0.7,
  flaskColor = 'rgba(203, 213, 225, 0.45)',
  flaskFraction = 0.55,
  dripping = false,
}) {
  const bClamped = Math.min(1, Math.max(0, buretteFraction))
  const fClamped = Math.min(1, Math.max(0, flaskFraction))

  const buretteLiquidTop = B_TOP + (1 - bClamped) * (B_BOTTOM - B_TOP)
  const flaskLiquidTop = F_BOTTOM - fClamped * (F_BOTTOM - F_TOP)

  return (
    <svg
      viewBox="0 0 320 540"
      className="w-full h-full max-h-[520px]"
      role="img"
      aria-label="Burette dispensing NaOH into a conical flask of HCl with phenolphthalein indicator"
    >
      <defs>
        <clipPath id="flaskInner">
          <path d="M137,406 L137,446 L97,491 Q95,497 102,497 L198,497 Q205,497 203,491 L163,446 L163,406 Z" />
        </clipPath>
        <clipPath id="buretteInner">
          <rect x="138" y={B_TOP} width="24" height={B_BOTTOM - B_TOP} rx="6" />
        </clipPath>
        <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---------- Retort stand (behind glassware) ---------- */}
      <g fill="#475569">
        <rect x="140" y="508" width="162" height="18" rx="5" />
        <rect x="288" y="96" width="12" height="418" rx="4" />
        {/* clamp arm reaching to the burette */}
        <rect x="162" y="150" width="132" height="9" rx="4" />
      </g>

      {/* ---------- Burette ---------- */}
      {/* glass tube */}
      <rect
        x="135"
        y="66"
        width="30"
        height="286"
        rx="9"
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth="2"
      />
      {/* titrant liquid (NaOH — faint blue tint for visibility) */}
      <g clipPath="url(#buretteInner)">
        <rect
          x="138"
          y={buretteLiquidTop}
          width="24"
          height={B_BOTTOM - buretteLiquidTop}
          fill="rgba(96,165,250,0.40)"
        />
        <rect
          x="138"
          y={buretteLiquidTop}
          width="24"
          height="3"
          fill="rgba(59,130,246,0.55)"
        />
      </g>
      {/* graduation ticks + numbers */}
      <g stroke="#64748b" strokeWidth="1.4">
        {GRADS.map((g, i) => {
          const y = 92 + i * ((330 - 92) / (GRADS.length - 1))
          return <line key={g} x1="135" y1={y} x2="127" y2={y} />
        })}
      </g>
      <g fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif" textAnchor="end">
        {GRADS.map((g, i) => {
          const y = 92 + i * ((330 - 92) / (GRADS.length - 1))
          return (
            <text key={g} x="124" y={y + 3}>
              {g}
            </text>
          )
        })}
      </g>
      {/* glass highlight */}
      <rect x="140" y="72" width="5" height="270" rx="2.5" fill="url(#glassSheen)" />

      {/* stopcock */}
      <rect x="140" y="350" width="20" height="14" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="170" cy="357" r="6" fill="#ef4444" />
      <rect x="160" y="354" width="12" height="6" rx="3" fill="#ef4444" />
      {/* delivery tip */}
      <path d="M145,364 L155,364 L151,396 L149,396 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

      {/* falling drop (only while dispensing) */}
      {dripping && (
        <circle cx="150" cy="404" r="3.2" fill="rgba(96,165,250,0.75)">
          <animate attributeName="cy" from="398" to="470" dur="0.45s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="1" to="0" dur="0.45s" repeatCount="indefinite" />
        </circle>
      )}

      {/* ---------- Conical flask ---------- */}
      {/* liquid (drawn first, clipped to interior) */}
      <g clipPath="url(#flaskInner)">
        <rect
          x="88"
          y={flaskLiquidTop}
          width="124"
          height={502 - flaskLiquidTop}
          fill={flaskColor}
          style={{ transition: 'fill 350ms ease' }}
        />
        {/* surface sheen */}
        <rect x="88" y={flaskLiquidTop} width="124" height="3" fill="rgba(255,255,255,0.35)" />
      </g>
      {/* glass outline */}
      <path
        d="M132,404 L132,446 L92,492 Q89,502 100,503 L200,503 Q211,502 208,492 L168,446 L168,404"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* mouth / rim */}
      <ellipse cx="150" cy="404" rx="20" ry="4.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
      {/* glass sheen on the body */}
      <path
        d="M138,452 L120,492 Q118,498 124,498 L132,498 L150,454 Z"
        fill="url(#glassSheen)"
        clipPath="url(#flaskInner)"
        opacity="0.7"
      />
    </svg>
  )
}
