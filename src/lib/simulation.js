/**
 * Titration simulation — strong base (NaOH) titrated INTO strong acid (HCl).
 * Reaction:  HCl + NaOH -> NaCl + H2O   (1 : 1 mole ratio)
 *
 * This module is 100% pure math. It has NO dependency on React or the AI —
 * the whole experiment is fully playable from these functions alone.
 */

// ── Known, given quantities ────────────────────────────────────────────────
// Numbers mirror a real university lab manual's worked example so they line up
// with a reference: 10.00 mL of unknown HCl, diluted to ~100 mL, titrated with
// standard 0.100 M NaOH; a 0.100 M result needs exactly 10.00 mL of titrant.
export const NAOH_MOLARITY = 0.1 // standard titrant in the burette (mol/L)
export const HCL_VOLUME_ML = 10.0 // unknown acid pipetted into the flask (mL)
export const FLASK_DILUTION_ML = 100.0 // total solution volume in the flask (for pH)
export const BURETTE_CAPACITY = 50.0 // mL the burette holds

// ── The "unknown" the student is discovering ───────────────────────────────
// Kept fixed so the demo endpoint is predictable (exactly 10.0 mL of NaOH).
// ~0.1 mol/L HCl is about the strength of human stomach acid — a real-world hook.
// TODO: randomize this on Reset for replayability — left fixed for a scripted demo.
export const HCL_MOLARITY_TRUE = 0.1

// Endpoint volume from M1V1 = M2V2  ->  V(NaOH) = (M_HCl * V_HCl) / M_NaOH
export const ENDPOINT_VOLUME =
  (HCL_MOLARITY_TRUE * HCL_VOLUME_ML) / NAOH_MOLARITY // = 10.0 mL

// ── Small helpers ──────────────────────────────────────────────────────────
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

export const progressFor = (volumeAdded) => volumeAdded / ENDPOINT_VOLUME

// Moles in mmol (Molarity × mL) — friendlier numbers for display/report.
export const molesNaOHAdded = (volumeAdded) => NAOH_MOLARITY * volumeAdded
export const molesHClInitial = () => HCL_MOLARITY_TRUE * HCL_VOLUME_ML // = 2.0 mmol

/** What the student computes from THEIR burette reading (the real run number). */
export const computeHClMolarity = (volumeAdded) =>
  (NAOH_MOLARITY * volumeAdded) / HCL_VOLUME_ML

/** Endpoint status from the current volume dispensed. */
export function statusFor(volumeAdded) {
  if (volumeAdded <= 0) return 'ready'
  const p = progressFor(volumeAdded)
  if (p >= 1.0) return p > 1.08 ? 'over' : 'endpoint'
  if (p >= 0.92) return 'near'
  return 'titrating'
}

/** How far past the endpoint the student went (mL); 0 if not over-titrated. */
export const overshootMl = (volumeAdded) => Math.max(0, volumeAdded - ENDPOINT_VOLUME)

/**
 * pH of the flask after `volumeAdded` mL of NaOH (strong acid–strong base).
 * Excess H+ before equivalence, exactly 7 at equivalence, excess OH- after.
 * Total volume grows as titrant is added, which sets the realistic curve shape.
 */
export function pHFor(volumeAdded) {
  const molesH0 = (HCL_MOLARITY_TRUE * HCL_VOLUME_ML) / 1000 // mol H+ initially
  const molesOH = (NAOH_MOLARITY * volumeAdded) / 1000 // mol OH- added
  const totalL = (FLASK_DILUTION_ML + volumeAdded) / 1000 // litres of solution
  const diff = molesH0 - molesOH // + = excess acid, - = excess base
  if (Math.abs(diff) < 1e-12) return 7
  if (diff > 0) return clamp(-Math.log10(diff / totalL), 0, 14)
  return clamp(14 + Math.log10(-diff / totalL), 0, 14)
}

// ── Indicator colour: colourless → faint pink → BRIGHT pink → deep pink ─────
const COLOURLESS = { r: 203, g: 213, b: 225, a: 0.38 } // pale so the liquid is visible
const PINK = { r: 224, g: 33, b: 138, a: 0.8 } // phenolphthalein endpoint
const DEEP = { r: 188, g: 18, b: 110, a: 0.9 } // over-titrated

const lerp = (a, b, t) => a + (b - a) * t
const mix = (c0, c1, t) =>
  `rgba(${Math.round(lerp(c0.r, c1.r, t))}, ${Math.round(lerp(c0.g, c1.g, t))}, ` +
  `${Math.round(lerp(c0.b, c1.b, t))}, ${+lerp(c0.a, c1.a, t).toFixed(3)})`

/**
 * Smooth, visually-obvious colour ramp keyed off titration progress.
 *  - < 0.95         : colourless
 *  - 0.95 .. 1.0    : faint pink that deepens (ease-in so it stays subtle then jumps)
 *  - >= 1.0         : bright pink, deepening with overshoot
 */
export function flaskColorForProgress(progress) {
  if (progress <= 0.95) return mix(COLOURLESS, COLOURLESS, 0)
  if (progress < 1.0) {
    const t = Math.pow((progress - 0.95) / 0.05, 1.8)
    return mix(COLOURLESS, PINK, t)
  }
  const t = clamp((progress - 1.0) / 0.25, 0, 1)
  return mix(PINK, DEEP, t)
}

/** Visual fill level of the flask (grows a little as titrant is added). */
export const flaskFillFraction = (volumeAdded) =>
  clamp(0.45 + (volumeAdded / BURETTE_CAPACITY) * 0.18, 0, 0.72)

/** Visual fill level of the burette (drains as titrant is dispensed). */
export const buretteFraction = (volumeAdded) =>
  clamp(1 - volumeAdded / BURETTE_CAPACITY, 0, 1)

/**
 * Snapshot of the *actual* run, used by both the AI report and the local
 * fallback report. All numbers are derived from the student's real reading.
 */
export function getRunData(volumeAdded, status) {
  const naohVolumeMl = +volumeAdded.toFixed(1)
  const hclMolarity = +computeHClMolarity(naohVolumeMl).toFixed(4)
  const overshoot = +overshootMl(naohVolumeMl).toFixed(1)
  return {
    reaction: 'HCl + NaOH → NaCl + H₂O (1 : 1)',
    indicator: 'phenolphthalein',
    naohMolarity: NAOH_MOLARITY, // 0.1 M (known titrant)
    naohVolumeMl, // student's endpoint reading
    hclVolumeMl: HCL_VOLUME_ML, // 10.0 mL (known volume of acid pipetted)
    hclMolarity, // computed unknown
    molesNaOH: +((NAOH_MOLARITY * naohVolumeMl) / 1000).toFixed(5), // mol
    molesHCl: +((hclMolarity * HCL_VOLUME_ML) / 1000).toFixed(5), // mol
    pHAtReading: +pHFor(naohVolumeMl).toFixed(2),
    overshootMl: overshoot,
    overTitrated: overshoot > 0,
    status,
    endpointColour: 'colourless → permanent pale pink',
    realWorld:
      'A ~0.1 mol/L HCl solution is about the concentration of human stomach acid (stomach pH ≈ 1–3).',
  }
}
