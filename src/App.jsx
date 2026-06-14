import { useReducer, useRef, useState, useCallback, useEffect } from 'react'
import Apparatus from './components/Apparatus.jsx'
import LabPartner from './components/LabPartner.jsx'
import Controls from './components/Controls.jsx'
import LabReport from './components/LabReport.jsx'
import TitrationCurve from './components/TitrationCurve.jsx'
import Lesson from './components/Lesson.jsx'
import {
  NAOH_MOLARITY,
  HCL_VOLUME_ML,
  BURETTE_CAPACITY,
  clamp,
  statusFor,
  progressFor,
  pHFor,
  flaskColorForProgress,
  flaskFillFraction,
  buretteFraction,
  getRunData,
} from './lib/simulation.js'
import { getPartnerMessage, generateLabReport, getLessonNarration, hasGroqKey } from './lib/groq.js'
import { buildFallbackReport } from './lib/report.js'
import { LESSON } from './lib/lesson.js'

// ── Lab-partner copy ────────────────────────────────────────────────────────
const WELCOME = [
  "Hi! I'm Aria, your lab partner. Today we'll find the unknown concentration of the HCl in your flask. 🧪",
  'Open the stopcock to add NaOH drop by drop. Watch the flask closely — the first lasting pink is our endpoint!',
]

// Rule-based milestone messages. In Step 3 these become the graceful FALLBACK
// when a Groq call fails, so the panel always feels alive.
const FALLBACK = {
  start: 'Nice — NaOH is flowing in. Swirl the flask gently so the base mixes evenly with the acid.',
  near: "You're getting close! Switch to single drops now so you don't shoot past the endpoint.",
  endpoint:
    'That lasting pink is the endpoint! 🎉 The acid is fully neutralized — note your burette reading.',
  over: 'A little past the endpoint — the deeper pink means you overshot. Note it down, or Reset for a cleaner run.',
}

// ── Reducer: the single source of truth for the run ─────────────────────────
function freshState() {
  return {
    volumeAdded: 0,
    status: 'ready',
    messages: WELCOME.map((t, i) => ({ id: `w${i}`, text: t })),
    announced: {}, // milestones already announced (so each fires once)
    seq: 0, // monotonic id counter for message keys
    pendingEvent: null, // { key, msgId, volumeAdded, status } — Step 3 hooks the AI here
    curve: [{ v: 0, ph: pHFor(0) }], // pH-vs-volume points, plotted live
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      // Snap to 0.1 mL so 0.1-mL drops don't accumulate float drift (which
      // could leave the endpoint at 9.9999999 and never register as reached).
      const raw = clamp(state.volumeAdded + action.amount, 0, BURETTE_CAPACITY)
      const v = Math.round(raw * 10) / 10
      if (v === state.volumeAdded) return state // burette empty — nothing changes
      const status = statusFor(v)
      const announced = { ...state.announced }
      const messages = state.messages.slice()
      let seq = state.seq
      let pendingEvent = null

      const fire = (key) => {
        if (announced[key]) return
        announced[key] = true
        seq += 1
        const id = `m${seq}`
        messages.push({ id, text: FALLBACK[key] })
        pendingEvent = { key, msgId: id, volumeAdded: v, status }
      }

      if (v > 0) fire('start')
      if (status === 'near') fire('near')
      if (status === 'endpoint') fire('endpoint')
      if (status === 'over') fire('over')

      const curve = [...state.curve, { v, ph: pHFor(v) }]

      return { ...state, volumeAdded: v, status, messages, announced, seq, pendingEvent, curve }
    }
    case 'PUSH_MESSAGE': {
      const seq = state.seq + 1
      return { ...state, seq, messages: [...state.messages, { id: `m${seq}`, text: action.text }] }
    }
    case 'REPLACE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, text: action.text } : m,
        ),
      }
    case 'CLEAR_PENDING':
      return { ...state, pendingEvent: null }
    case 'RESET':
      return freshState()
    default:
      return state
  }
}

// ── Presentational sub-pieces ───────────────────────────────────────────────
const STATUS_META = {
  ready: { label: 'Ready', dot: 'bg-slate-400', text: 'text-slate-600', ring: 'ring-slate-200' },
  titrating: { label: 'Titrating…', dot: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-200' },
  near: { label: 'Approaching endpoint', dot: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200' },
  endpoint: { label: 'Endpoint reached!', dot: 'bg-pheno', text: 'text-pheno-deep', ring: 'ring-pink-200' },
  over: { label: 'Over-titrated', dot: 'bg-rose-600', text: 'text-rose-700', ring: 'ring-rose-200' },
}

function StatusChip({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.ready
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold ${m.text} ring-1 ${m.ring}`}
    >
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function ReagentLegend() {
  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex items-start gap-2.5">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-sm bg-blue-400/70 ring-1 ring-blue-500/40" />
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">Burette · NaOH</span> — standard titrant,{' '}
          <span className="font-semibold">{NAOH_MOLARITY.toFixed(3)} M</span> (known)
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-pink-200 ring-1 ring-pink-400/50" />
        <p className="text-slate-600">
          <span className="font-semibold text-slate-800">Flask · HCl</span> —{' '}
          <span className="font-semibold">{HCL_VOLUME_ML.toFixed(1)} mL</span> of unknown molarity,
          with phenolphthalein indicator
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState)
  const { volumeAdded, status, messages, curve } = state

  const progress = progressFor(volumeAdded)
  const currentPh = pHFor(volumeAdded)
  const endpointReached = status === 'endpoint' || status === 'over'
  const buretteEmpty = volumeAdded >= BURETTE_CAPACITY

  // Falling-drop flourish: show a drop for ~550ms after each dispense.
  const [dripping, setDripping] = useState(false)
  const dripTimer = useRef(null)

  // Lab report modal (Groq Call 2). data is null while loading.
  const [reportState, setReportState] = useState({
    open: false,
    loading: false,
    data: null,
    runData: null,
    aiGenerated: false,
  })

  const pulse = useCallback((amount) => {
    dispatch({ type: 'ADD', amount })
    setDripping(true)
    clearTimeout(dripTimer.current)
    dripTimer.current = setTimeout(() => setDripping(false), 550)
  }, [])

  const onAddDrop = () => pulse(0.1)
  const onAddMl = () => pulse(1.0)
  const onReset = () => {
    clearTimeout(dripTimer.current)
    setDripping(false)
    dispatch({ type: 'RESET' })
  }
  // ── Groq Call 2: generate the lab report from the REAL run numbers ──
  // Snapshot the run, open the modal in a loading state, then ask Groq. On any
  // failure we render the deterministic local report (numbers always correct).
  const onGenerateReport = useCallback(() => {
    const runData = getRunData(volumeAdded, status)
    setReportState({ open: true, loading: true, data: null, runData, aiGenerated: false })

    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 20000)

    generateLabReport(runData, { signal: ctrl.signal })
      .then((data) =>
        setReportState((s) => ({ ...s, loading: false, data, aiGenerated: true })),
      )
      .catch(() =>
        setReportState((s) => ({
          ...s,
          loading: false,
          data: buildFallbackReport(runData),
          aiGenerated: false,
        })),
      )
      .finally(() => clearTimeout(timeout))
  }, [volumeAdded, status])

  const closeReport = () => setReportState((s) => ({ ...s, open: false }))

  // ── Lesson Mode: Aria teaches the experiment step by step ──
  const [lesson, setLesson] = useState({
    active: false,
    step: 0,
    text: '',
    ai: false, // whether the current text came from the AI (vs scripted fallback)
    loading: false,
  })

  // Latest volume, read inside the narration effect without re-triggering it.
  const volRef = useRef(volumeAdded)
  volRef.current = volumeAdded

  const enterLesson = useCallback(() => {
    dispatch({ type: 'RESET' }) // start the guided run from a clean flask
    setLesson({ active: true, step: 0, text: LESSON[0].teach, ai: false, loading: true })
  }, [])
  const exitLesson = () => setLesson((l) => ({ ...l, active: false }))
  const lessonNext = () =>
    setLesson((l) =>
      l.step >= LESSON.length - 1 ? { ...l, active: false } : { ...l, step: l.step + 1 },
    )
  const lessonBack = () => setLesson((l) => ({ ...l, step: Math.max(0, l.step - 1) }))

  // Load each step's narration: scripted text instantly, AI teacher voice swapped
  // in when it returns. On any failure the scripted text stays.
  const lessonActive = lesson.active
  const lessonStep = lesson.step
  useEffect(() => {
    if (!lessonActive) return
    const step = LESSON[lessonStep]
    setLesson((l) => ({ ...l, text: step.teach, ai: false, loading: true }))

    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 9000)

    getLessonNarration(step, { volumeAdded: volRef.current }, { signal: ctrl.signal })
      .then((t) => {
        if (t) setLesson((l) => (l.active && l.step === lessonStep ? { ...l, text: t, ai: true } : l))
      })
      .catch(() => {
        /* keep the scripted teacher text */
      })
      .finally(() => {
        clearTimeout(timeout)
        setLesson((l) => (l.step === lessonStep ? { ...l, loading: false } : l))
      })

    return () => {
      clearTimeout(timeout)
      ctrl.abort()
    }
  }, [lessonActive, lessonStep])

  // ── Groq Call 1: live lab-partner messages ──
  // A milestone has already pushed an instant local message (pendingEvent.msgId).
  // We ask Groq for a friendlier line and swap it in when it arrives. On any
  // failure (no key, network, timeout) we simply keep the local message.
  const pendingEvent = state.pendingEvent
  useEffect(() => {
    if (!pendingEvent) return
    if (lessonActive) {
      // Lesson Mode delivers its own teaching; don't stack milestone AI on top.
      dispatch({ type: 'CLEAR_PENDING' })
      return
    }
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 8000) // don't let a slow call hang

    getPartnerMessage(pendingEvent, { signal: ctrl.signal })
      .then((text) => {
        if (text) dispatch({ type: 'REPLACE_MESSAGE', id: pendingEvent.msgId, text })
      })
      .catch(() => {
        /* keep the instant fallback message — sim never depends on AI */
      })
      .finally(() => {
        clearTimeout(timeout)
        dispatch({ type: 'CLEAR_PENDING' })
      })

    return () => {
      clearTimeout(timeout)
      ctrl.abort()
    }
  }, [pendingEvent, lessonActive])

  // Derived lesson view-data for the current step.
  const lessonStepMeta = lessonActive ? LESSON[lessonStep] : null
  const lessonRunData = lessonActive ? getRunData(volumeAdded, status) : null
  const lessonFormula = lessonStepMeta?.formula
    ? typeof lessonStepMeta.formula === 'function'
      ? lessonStepMeta.formula(lessonRunData)
      : lessonStepMeta.formula
    : null
  const lessonAction = lessonStepMeta?.action
    ? { prompt: lessonStepMeta.action.prompt, done: lessonStepMeta.action.gate(volumeAdded, status) }
    : null
  const highlightCurve = Boolean(lessonStepMeta?.highlightCurve)

  return (
    <div className="bench-bg min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-7">
        {/* ── Header ── */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pheno to-pheno-deep shadow-md">
              <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
                <path
                  d="M13 5h6v2h-1v6.2l5.4 10.7A3 3 0 0 1 20.7 28H11.3a3 3 0 0 1-2.7-4.1L14 13.2V7h-1z"
                  fill="#fff"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
                Titra<span className="text-pheno">Lab</span>
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Virtual acid–base titration · with an AI lab partner
              </p>
            </div>
          </div>
          <div className="hidden rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 sm:block">
            Strong acid–base · phenolphthalein
          </div>
        </header>

        {/* ── Main grid: bench (2/3) + lab partner (1/3) ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Bench */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-bench ring-1 ring-slate-200/70">
              <div className="flex flex-col gap-6 md:flex-row">
                {/* Apparatus */}
                <div className="flex justify-center md:w-[300px] md:shrink-0">
                  <Apparatus
                    buretteFraction={buretteFraction(volumeAdded)}
                    flaskColor={flaskColorForProgress(progress)}
                    flaskFraction={flaskFillFraction(volumeAdded)}
                    dripping={dripping}
                  />
                </div>

                {/* Info column */}
                <div className="flex flex-1 flex-col gap-4">
                  <ReagentLegend />

                  <div
                    className={`rounded-xl p-5 ring-1 transition-colors ${
                      endpointReached ? 'bg-pink-50 ring-pink-200' : 'bg-slate-50 ring-slate-200/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Volume of NaOH added
                        </p>
                        <div className="mt-1 flex items-end gap-1.5">
                          <span
                            className={`text-5xl font-extrabold tabular-nums tracking-tight transition-colors ${
                              endpointReached ? 'text-pheno-deep' : 'text-slate-800'
                            }`}
                          >
                            {volumeAdded.toFixed(1)}
                          </span>
                          <span className="mb-1.5 text-lg font-semibold text-slate-400">mL</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Solution pH
                        </p>
                        <span
                          className={`text-3xl font-bold tabular-nums ${
                            currentPh < 6
                              ? 'text-rose-500'
                              : currentPh > 8
                                ? 'text-indigo-500'
                                : 'text-emerald-500'
                          }`}
                        >
                          {currentPh.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusChip status={status} />
                      {endpointReached && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          ≈ strength of stomach acid (0.1 M)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live titration curve (the manual's pH-meter method) */}
                  <div
                    className={`rounded-xl bg-white p-4 ring-1 transition-all ${
                      highlightCurve ? 'ring-2 ring-pheno/60 shadow-md' : 'ring-slate-200/70'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Live titration curve
                      </p>
                      <span className="text-[11px] font-medium text-slate-400">
                        equivalence at the steep jump
                      </span>
                    </div>
                    <TitrationCurve points={curve} highlight={endpointReached} />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <Controls
                  onAddDrop={onAddDrop}
                  onAddMl={onAddMl}
                  onReset={onReset}
                  onGenerateReport={onGenerateReport}
                  addDisabled={buretteEmpty}
                  reportDisabled={volumeAdded === 0}
                />
                {buretteEmpty ? (
                  <p className="mt-2 text-xs font-medium text-rose-500">
                    Burette is empty — press Reset to refill and start a new run.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    Tip: use <span className="font-semibold text-slate-500">Add 1 mL</span> to get
                    close, then switch to <span className="font-semibold text-slate-500">Add drop</span>{' '}
                    near the endpoint — watch the curve and the flask change together.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Lab partner / Lesson Mode */}
          <aside className="lg:col-span-1">
            {lessonActive ? (
              <Lesson
                step={lessonStepMeta}
                index={lessonStep}
                total={LESSON.length}
                text={lesson.text}
                ai={lesson.ai}
                loading={lesson.loading}
                formulaLines={lessonFormula}
                action={lessonAction}
                onNext={lessonNext}
                onBack={lessonBack}
                onExit={exitLesson}
                isFirst={lessonStep === 0}
                isLast={lessonStep === LESSON.length - 1}
              />
            ) : (
              <LabPartner messages={messages} aiLive={hasGroqKey()} onStartLesson={enterLesson} />
            )}
          </aside>
        </div>

        <footer className="mt-6 text-center text-xs text-slate-400">
          TitraLab · built for students who learn chemistry without a lab.
        </footer>
      </div>

      <LabReport
        open={reportState.open}
        loading={reportState.loading}
        report={reportState.data}
        runData={reportState.runData}
        aiGenerated={reportState.aiGenerated}
        onClose={closeReport}
      />
    </div>
  )
}
