/**
 * Controls — the dispensing buttons + Reset + Generate Lab Report.
 * Pure presentational: handlers are passed in from App.
 */

function Btn({ children, onClick, variant = 'default', disabled }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40'
  const styles = {
    default: 'bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    ghost: 'bg-white text-slate-600 hover:bg-slate-50 ring-1 ring-slate-200',
    accent: 'bg-pheno text-white hover:bg-pheno-deep shadow-sm',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  )
}

export default function Controls({
  onAddDrop,
  onAddMl,
  onReset,
  onGenerateReport,
  addDisabled = false,
  reportDisabled = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Btn variant="primary" onClick={onAddDrop} disabled={addDisabled}>
        <span className="text-base leading-none">💧</span> Add drop
        <span className="text-xs font-normal opacity-80">0.1 mL</span>
      </Btn>
      <Btn variant="primary" onClick={onAddMl} disabled={addDisabled}>
        Add 1 mL
      </Btn>
      <Btn variant="ghost" onClick={onReset}>
        ↺ Reset
      </Btn>
      <div className="ml-auto">
        <Btn variant="accent" onClick={onGenerateReport} disabled={reportDisabled}>
          📄 Generate Lab Report
        </Btn>
      </div>
    </div>
  )
}
