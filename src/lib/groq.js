/**
 * Groq client (OpenAI-compatible). Call sites:
 *   1. getPartnerMessage()   — short live lab-partner lines
 *   2. generateLabReport()   — the structured report
 *   3. getLessonNarration()  — live teacher narration for Lesson Mode
 *
 * Design rule: the simulation NEVER depends on this. Every failure path here
 * throws, and callers fall back to local text. The key is read from the env
 * (import.meta.env.VITE_GROQ_API_KEY) and is never hardcoded.
 *
 * Note: this is a no-backend SPA, so the key is used directly in the browser
 * (as the project spec requires). Fine for a local demo; see README.
 */

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const apiKey = () => import.meta.env.VITE_GROQ_API_KEY

/** True when a key is configured — used to show the AI status in the UI. */
export const hasGroqKey = () => Boolean(apiKey())

/** Low-level chat call. Throws on missing key, network error, or bad response. */
async function chat({ messages, max_tokens, temperature = 0.6, signal, responseFormat }) {
  const key = apiKey()
  if (!key) throw new Error('no-key')

  const body = { model: MODEL, max_tokens, temperature, messages }
  if (responseFormat) body.response_format = responseFormat

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`groq-${res.status}`)
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('empty-response')
  return text
}

// ── Call 1: live lab-partner message ────────────────────────────────────────
const PARTNER_SYSTEM = `You are Aria, a warm and encouraging chemistry lab partner for a 14-year-old student.
They are doing a virtual acid-base titration: standard 0.100 M NaOH from a burette is being added into a flask holding an unknown concentration of HCl with phenolphthalein indicator (colourless in acid, pink in base).
Reply with ONE or TWO short sentences only. Friendly, plain language, explain what is happening or what to do next.
No markdown, no lists, no emoji spam (one emoji at most). Never state the exact endpoint volume or the unknown concentration — let the student discover it themselves.`

const EVENT_BRIEF = {
  start: 'The student just began adding NaOH from the burette.',
  near: 'A faint pink is starting to appear and fade — the endpoint is getting close.',
  endpoint: 'The solution just turned a lasting pink: this is the endpoint, the acid is neutralised.',
  over: 'The student kept going past the endpoint and the pink is now deep — they over-titrated.',
}

/**
 * Get a short live message for a milestone event.
 * @param {{key:string, volumeAdded:number}} ev
 * @param {{signal?:AbortSignal}} [opts]
 * @returns {Promise<string>}
 */
export function getPartnerMessage(ev, { signal } = {}) {
  const brief = EVENT_BRIEF[ev.key] ?? 'The student is in the middle of titrating.'
  const user = `${brief} Burette reading so far: ${ev.volumeAdded.toFixed(1)} mL of 0.100 M NaOH added. Give one short, encouraging note about what just happened or what to do next.`

  return chat({
    signal,
    max_tokens: 80,
    temperature: 0.6,
    messages: [
      { role: 'system', content: PARTNER_SYSTEM },
      { role: 'user', content: user },
    ],
  })
}

// ── Call 3: live lesson narration (teaching mode) ───────────────────────────
const TEACHER_SYSTEM = `You are Aria, a warm, patient chemistry teacher giving a live one-on-one lesson to a 14-year-old who is doing a virtual acid-base titration (standard 0.100 M NaOH added from a burette into a flask of unknown HCl with phenolphthalein indicator).
You are teaching ONE step of the lesson. Speak directly to the student in 2 or 3 short, clear sentences. Be encouraging and concrete; explain the idea in plain language, and if it is a hands-on step tell them exactly what to do.
No markdown, no bullet lists, at most one emoji. Stay on the given teaching points and never contradict them. Do not reveal the final answer before the calculation step.`

/**
 * Get the teacher's spoken narration for one lesson step.
 * @param {{title:string, points:string[]}} step
 * @param {{volumeAdded?:number}} [ctx]
 * @param {{signal?:AbortSignal}} [opts]
 * @returns {Promise<string>}
 */
export function getLessonNarration(step, ctx = {}, { signal } = {}) {
  const reading =
    typeof ctx.volumeAdded === 'number'
      ? ` So far the student has added ${ctx.volumeAdded.toFixed(1)} mL of NaOH.`
      : ''
  const user = `Teach this lesson step titled "${step.title}".
Teaching points to cover:
- ${step.points.join('\n- ')}${reading}
Give the teacher's spoken explanation for this step now (2-3 short sentences).`

  return chat({
    signal,
    max_tokens: 150,
    temperature: 0.5,
    messages: [
      { role: 'system', content: TEACHER_SYSTEM },
      { role: 'user', content: user },
    ],
  })
}

// ── Call 2: structured lab report ───────────────────────────────────────────
const REPORT_SYSTEM = `You are a chemistry teacher writing a clean, accurate practical lab report for a Grade 9-10 student's record book.
The experiment: an unknown hydrochloric acid (HCl) solution is titrated against a standard sodium hydroxide (NaOH) solution using phenolphthalein indicator. Reaction: HCl + NaOH -> NaCl + H2O (1:1 mole ratio).
Return ONLY a single JSON object (no prose, no markdown fences) with EXACTLY these keys:
- "aim": string
- "apparatus": array of strings
- "procedure": array of step strings
- "observationTable": { "headers": array of strings, "rows": array of arrays of strings }
- "calculation": array of strings (each one line of working; MUST show M1V1 = M2V2 with the real numbers)
- "result": string
- "precautions": array of strings
CRITICAL: use ONLY the exact numbers provided in the user's data. Do not invent, change, or re-round them. The calculation must arrive at the provided HCl concentration. If the data has a "realWorld" note, add it as one short closing sentence in the result. Language must suit a 14-15 year old.`

const REQUIRED_KEYS = [
  'aim',
  'apparatus',
  'procedure',
  'observationTable',
  'calculation',
  'result',
  'precautions',
]

function parseReport(text) {
  // json mode usually returns clean JSON; strip stray code fences just in case.
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const obj = JSON.parse(cleaned)
  for (const k of REQUIRED_KEYS) {
    if (!(k in obj)) throw new Error(`missing-key-${k}`)
  }
  if (!Array.isArray(obj.apparatus) || !Array.isArray(obj.procedure)) throw new Error('bad-arrays')
  if (!Array.isArray(obj.calculation) || !Array.isArray(obj.precautions)) throw new Error('bad-arrays')
  if (!obj.observationTable?.headers || !obj.observationTable?.rows) throw new Error('bad-table')
  return obj
}

/**
 * Generate the structured lab report from the real run data.
 * Throws on any failure so the caller can render the local fallback report.
 * @returns {Promise<object>} report object matching the schema above.
 */
export async function generateLabReport(runData, { signal } = {}) {
  const text = await chat({
    signal,
    max_tokens: 1100,
    temperature: 0.3,
    responseFormat: { type: 'json_object' },
    messages: [
      { role: 'system', content: REPORT_SYSTEM },
      {
        role: 'user',
        content:
          'Write the lab report using exactly this run data:\n' +
          JSON.stringify(runData, null, 2),
      },
    ],
  })
  return parseReport(text)
}
