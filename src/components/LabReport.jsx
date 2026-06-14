import { useState, useRef, useEffect } from 'react'
import { reportToMarkdown } from '../lib/report.js'

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-pheno-deep">{title}</h3>
      {children}
    </section>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-pheno" />
      <p className="text-sm font-medium">Aria is writing up your lab report…</p>
    </div>
  )
}

export default function LabReport({ open, loading, report, runData, aiGenerated, onClose }) {
  const [copied, setCopied] = useState(false)
  const bodyRef = useRef(null)

  // Always show the report from the top (Aim first), not mid-scroll.
  useEffect(() => {
    if (open && !loading && bodyRef.current) bodyRef.current.scrollTop = 0
  }, [open, loading])

  if (!open) return null

  const flash = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const copy = async () => {
    const text = reportToMarkdown(report, runData)
    // Preferred: async Clipboard API (works on localhost — a secure context).
    try {
      await navigator.clipboard.writeText(text)
      flash()
      return
    } catch {
      /* fall back to the legacy method below */
    }
    // Fallback: hidden textarea + execCommand, for any context that blocks the API.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      flash()
    } catch {
      /* nothing more we can do; leave the button label unchanged */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-800">📄 Lab Report</h2>
            {!loading &&
              report &&
              (aiGenerated ? (
                <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pheno-deep ring-1 ring-pink-200">
                  ✨ AI-generated
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  offline template
                </span>
              ))}
          </div>
          <div className="flex items-center gap-2">
            {!loading && report && (
              <button
                onClick={copy}
                className="rounded-lg bg-pheno px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-pheno-deep active:scale-95"
              >
                {copied ? '✓ Copied!' : 'Copy report'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close report"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="msg-scroll overflow-y-auto px-6 py-5">
          {loading || !report ? (
            <Spinner />
          ) : (
            <>
              <Section title="Aim">
                <p className="text-sm leading-relaxed text-slate-700">{report.aim}</p>
              </Section>

              <Section title="Apparatus">
                <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
                  {report.apparatus.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-300">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Procedure">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700 marker:font-semibold marker:text-pheno">
                  {report.procedure.map((p, i) => (
                    <li key={i} className="pl-1">
                      {p}
                    </li>
                  ))}
                </ol>
              </Section>

              <Section title="Observation Table">
                <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                        {report.observationTable.headers.map((h, i) => (
                          <th key={i} className="border-b border-slate-200 px-3 py-2">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.observationTable.rows.map((row, ri) => (
                        <tr key={ri} className="text-slate-700">
                          {row.map((cell, ci) => (
                            <td key={ci} className="border-b border-slate-100 px-3 py-2 tabular-nums">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Calculation">
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-100">
                  {report.calculation.join('\n')}
                </pre>
              </Section>

              <Section title="Result">
                <p className="rounded-lg bg-pink-50 px-4 py-3 text-sm font-semibold leading-relaxed text-pheno-deep ring-1 ring-pink-200">
                  {report.result}
                </p>
              </Section>

              <Section title="Precautions">
                <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
                  {report.precautions.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-pheno">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
