# TitraLab — AI Virtual Titration Lab 🧪

**Do a real acid–base titration in the browser, get taught it step-by-step by a
live AI teacher, and auto-generate the practical-record lab report you're graded
on — no lab, no equipment, no login.**

Built for **DSH Hacks V1 — AI × STEM Education**.

---

## What it is

TitraLab is a single-page web app where a student performs a **strong acid –
strong base titration** virtually:

- A **burette** of standard **0.100 M NaOH** dispensed drop-by-drop.
- A **conical flask** of **unknown HCl + phenolphthalein** that turns from
  colourless to **bright pink** at the endpoint.
- A **live pH-vs-volume titration curve** showing the steep jump at equivalence.
- A **live AI lab partner ("Aria")** that reacts to each action.
- A guided **Lesson Mode** where Aria teaches the whole experiment step by step.
- A one-click **AI-generated lab report** using the student's *actual* run numbers.

## Who it's for

**Grade 9–10 students in under-resourced / rural schools** who are graded on a
chemistry *practical record* for experiments they have often never physically
performed. TitraLab lets them genuinely *do* and *understand* the experiment, then
produce the report — turning a copied formality into real learning.

---

## The experiment (and the chemistry)

| Item | Value |
|---|---|
| Titrant (burette) | standard **0.100 M NaOH** (known) |
| Analyte (flask) | **10.00 mL** unknown HCl, diluted to ~100 mL, + phenolphthalein |
| Reaction | HCl + NaOH → H₂O + NaCl (1 : 1) |
| Endpoint | **10.0 mL** of NaOH → first lasting pink |
| Result | M(HCl) = (0.100 × 10.0) ÷ 10.0 = **0.100 M** |

The numbers mirror a **standard university lab-manual worked example**. ~0.1 M HCl
is about the strength of **human stomach acid** — a real-world hook surfaced in the
app, the lesson, and the report. The pH model is real: pH 2 at the start, **exactly
pH 7 at equivalence** (correct for strong–strong), rising past 11 when over-titrated.

---

## Features

- 🎚️ **Accurate simulation** — moles-based, endpoint from M₁V₁ = M₂V₂, smooth
  colourless→pink ramp, over-titration tracking. **Works with zero AI.**
- 📈 **Live titration curve** — pH vs volume, plotted as you titrate.
- 🤖 **Live AI lab partner** — short, encouraging Groq messages on each milestone.
- 📚 **Lesson Mode** — an 11-step guided lesson where Aria teaches the theory,
  apparatus, hands-on procedure, the graph, and the M₁V₁=M₂V₂ calculation, live.
- 📄 **AI lab report** — Aim, Apparatus, Procedure, Observation Table, Calculation
  (real M₁V₁ = M₂V₂ working), Result, Precautions — plus **Copy report**.
- 🛟 **Graceful degradation** — with no API key or no network, the simulation,
  curve, lesson, and a deterministic local report all still work. **The AI only
  ever enhances; nothing depends on it.**

---

## Tech stack

- **Vite + React 18 + Tailwind CSS v3** — single-page app, all state in React.
- **Groq** (OpenAI-compatible) — model `llama-3.3-70b-versatile`.
- **No backend, no database, no login, no storage.**

---

## Run it locally

**Prerequisites:** Node.js 18+ (developed on Node 24).

```bash
# 1. Install dependencies
npm install

# 2. Add your Groq API key
copy .env.example .env        # Windows  (macOS/Linux: cp .env.example .env)
#    Edit .env:  VITE_GROQ_API_KEY=gsk_your_key_here
#    Get a free key at https://console.groq.com/keys

# 3. Start the dev server
npm run dev                   # → http://localhost:5173
```

Other scripts: `npm run build` (production build → `dist/`), `npm run preview`.

> **No key?** It still runs — the titration, curve, lesson, and report all work;
> the AI text falls back to built-in scripts.

---

## Deploy (Render static site)

This is a static Vite build, so it deploys as a Render **Static Site**:

1. Push this repo to GitHub.
2. Render → **New → Static Site** → connect this GitHub repo.
3. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add an environment variable: **`VITE_GROQ_API_KEY`** = your Groq key.
5. **Create Static Site** — Render builds and gives you a live URL.

> ⚠️ **Security:** `VITE_` variables are compiled into the browser bundle, so the
> key is visible to anyone who opens the deployed site. Use a **throwaway Groq key**
> for the public deploy and delete/rotate it after judging — or deploy **without** a
> key (the app still runs fully in fallback mode, just without live AI text).

---

## A note on the API key (no-backend design)

Because this is a pure front-end app (per the hackathon spec — no server), the Groq
key is used **directly from the browser**. That's fine for a local demo. For a
hardened deployment you'd move the Groq call behind a small serverless proxy so the
key stays secret. The `.env` file is **gitignored**.

---

## Project structure

```
TitraLab/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── .env.example            # template — your real .env is gitignored
├── README.md
├── public/
│   └── flask.svg           # favicon
└── src/
    ├── main.jsx            # React entry
    ├── index.css           # Tailwind + base styles
    ├── App.jsx             # layout + state (reducer) + AI wiring
    ├── components/
    │   ├── Apparatus.jsx      # SVG stand + burette + flask (colour-driven)
    │   ├── TitrationCurve.jsx # live pH-vs-volume chart
    │   ├── LabPartner.jsx     # AI "Aria" speech panel
    │   ├── Lesson.jsx         # guided Lesson Mode stepper
    │   ├── Controls.jsx       # dispensing / reset / report buttons
    │   └── LabReport.jsx      # report modal + Copy
    └── lib/
        ├── simulation.js   # pure titration + pH math (no AI)
        ├── groq.js         # the Groq calls (partner, report, lesson)
        ├── lesson.js       # the guided lesson script
        └── report.js       # deterministic fallback report + markdown
```

**Not committed** (in `.gitignore`): `.env` (your key), `node_modules/`, `dist/`,
and local tooling (`.vscode/`, `.claude/`).

---

## Demo flow (≈ for the video)

1. Click **📚 Start guided lesson** — Aria teaches the experiment step by step.
2. Follow her: add NaOH with **Add 1 mL**, then **Add drop** near the end.
3. At **10.0 mL** the flask turns **bright pink**, the curve jumps to **pH 7**.
4. She walks you through **M₁V₁=M₂V₂** with your real numbers.
5. Hit **Generate Lab Report** → a complete report → **Copy report**. Done.
