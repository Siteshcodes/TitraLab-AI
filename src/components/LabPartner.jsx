/**
 * LabPartner — the AI "lab partner" speech panel.
 * Step 1: renders static placeholder messages.
 * Step 3 will feed real Groq messages into the `messages` prop.
 */

function PartnerAvatar() {
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

function Bubble({ text, isLast }) {
  return (
    <div className={`flex gap-2.5 ${isLast ? 'animate-pop-in' : ''}`}>
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pheno/70" />
      <p className="rounded-2xl rounded-tl-sm bg-slate-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-700 ring-1 ring-slate-200/70">
        {text}
      </p>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2 text-slate-400">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-200ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-100ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
    </div>
  )
}

export default function LabPartner({ messages = [], typing = false, aiLive = false, onStartLesson }) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-bench ring-1 ring-slate-200/70">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
        <PartnerAvatar />
        <div>
          <p className="text-sm font-bold text-slate-800">Aria</p>
          {aiLive ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-pheno">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pheno" />
              live AI lab partner
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              built-in tips (no API key)
            </p>
          )}
        </div>
      </div>

      {onStartLesson && (
        <button
          onClick={onStartLesson}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pheno to-pheno-deep px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
        >
          📚 Start guided lesson
        </button>
      )}

      <div className="msg-scroll flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <Bubble key={m.id} text={m.text} isLast={i === messages.length - 1} />
        ))}
        {typing && <TypingDots />}
      </div>
    </div>
  )
}
