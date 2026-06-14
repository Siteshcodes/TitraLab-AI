/**
 * Lesson — Aria's guided, step-by-step teaching panel (Lesson Mode).
 * Pure presentational: App owns the lesson state and the AI narration.
 */

function TeacherAvatar() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pheno to-pheno-deep shadow-md ring-2 ring-white">
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
        <path
          d="M13 5h6v2h-1v6.2l5.4 10.7A3 3 0 0 1 20.7 28H11.3a3 3 0 0 1-2.7-4.1L14 13.2V7h-1z"
          fill="#ffffff"
        />
        <circle cx="13.5" cy="22" r="1.1" fill="#e0218a" />
        <circle cx="17.5" cy="24" r="0.9" fill="#e0218a" />
      </svg>
    </div>
  )
}

export default function Lesson({
  step,
  index,
  total,
  text,
  ai,
  loading,
  formulaLines,
  action,
  onNext,
  onBack,
  onExit,
  isFirst,
  isLast,
}) {
  const pct = Math.round(((index + 1) / total) * 100)

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-bench ring-1 ring-slate-200/70">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
        <TeacherAvatar />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Aria</p>
          <p className="flex items-center gap-1.5 text-xs font-medium text-pheno">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pheno" />
            teaching · live lesson
          </p>
        </div>
        <button
          onClick={onExit}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          Exit
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide">
          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-pheno-deep ring-1 ring-pink-100">
            {step.phase}
          </span>
          <span className="text-slate-400">
            Step {index + 1} of {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pheno to-pheno-deep transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lesson body (scrolls if long) */}
      <div className="msg-scroll flex-1 overflow-y-auto pr-1">
        <h3 className="mb-2 text-base font-extrabold text-slate-800">{step.title}</h3>

        <p className="animate-pop-in text-[14px] leading-relaxed text-slate-700">{text}</p>

        {loading && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
            Aria is explaining…
          </p>
        )}
        {ai && !loading && (
          <p className="mt-2 text-[11px] font-medium text-pheno/70">✨ explained live by AI</p>
        )}

        {/* Formula block */}
        {formulaLines && formulaLines.length > 0 && (
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-100">
            {formulaLines.join('\n')}
          </pre>
        )}

        {/* Hands-on task */}
        {action && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ring-1 transition-colors ${
              action.done
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-amber-50 text-amber-800 ring-amber-200'
            }`}
          >
            <p className="flex items-center gap-2 font-semibold">
              {action.done ? '✓ Nice — done!' : '👉 Try it on the bench'}
            </p>
            <p className="mt-0.5 text-[13px] font-medium opacity-90">{action.prompt}</p>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          onClick={onBack}
          disabled={isFirst}
          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ◂ Back
        </button>
        <button
          onClick={onNext}
          className={`ml-auto inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.97] ${
            action && !action.done
              ? 'bg-slate-400 hover:bg-slate-500'
              : 'bg-pheno hover:bg-pheno-deep'
          }`}
        >
          {isLast ? 'Finish lesson ✓' : 'Next ▸'}
        </button>
      </div>
    </div>
  )
}
