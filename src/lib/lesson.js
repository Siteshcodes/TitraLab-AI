/**
 * Guided "Lesson Mode" script — Aria teaches the experiment step by step.
 *
 * Grounded in the lab manual (Acid–Base Titration, Part B: titration with the
 * phenolphthalein indicator). The numbers match src/lib/simulation.js exactly:
 * 10.00 mL unknown HCl, standard 0.100 M NaOH, endpoint ≈ 10.0 mL, pH 7 at
 * equivalence, result ≈ 0.100 mol/L (about human stomach-acid strength).
 *
 * Each step:
 *   id              unique key
 *   phase           short category label (shown as a chip)
 *   title           step heading
 *   teach           scripted teacher text — shown instantly AND the offline fallback
 *   points          key facts handed to the AI so its narration stays correct
 *   action?         { prompt, gate(v,status) } a hands-on task done on the bench
 *   formula?        string[] | (runData)=>string[]  lines for a formula block
 *   highlightCurve? bool  draw attention to the live titration curve
 */

export const LESSON = [
  {
    id: 'intro',
    phase: 'Welcome',
    title: "Today's experiment",
    teach:
      "Hi, I'm Aria — today I'll teach you a real chemistry experiment: an acid–base titration. By the end you'll have discovered the hidden concentration of an unknown acid all by yourself. Let's begin!",
    points: [
      "Today's goal: find the concentration of an unknown acid by titration",
      'The student will do it hands-on and finish by calculating the answer',
    ],
  },
  {
    id: 'what',
    phase: 'Theory',
    title: 'What is a titration?',
    teach:
      "A titration is how chemists measure an unknown concentration. We slowly add a solution we know exactly (the titrant) to the one we don't (the analyte) until they have reacted completely. That balance point is called the equivalence point.",
    points: [
      'analyte = the unknown solution; titrant = the known solution',
      'equivalence point = moles of acid exactly equal moles of base',
      'we detect it from a colour change, or the steepest point of the pH curve',
    ],
  },
  {
    id: 'chemicals',
    phase: 'Theory',
    title: 'Our acid & base',
    teach:
      "In the flask is hydrochloric acid (HCl) of unknown strength — fun fact, it's about as strong as the acid in your stomach! In the burette is sodium hydroxide (NaOH), a base we know exactly: 0.100 M. When acid meets base they neutralise into water and salt.",
    points: [
      'flask: unknown HCl (about human stomach-acid strength)',
      'burette: standard 0.100 M NaOH (the titrant)',
      'reaction: HCl + NaOH → H2O + NaCl, a 1:1 ratio',
      'net ionic reaction: H3O+ + OH- → 2 H2O',
    ],
    formula: ['HCl + NaOH → H₂O + NaCl', 'net:  H₃O⁺ + OH⁻ → 2 H₂O'],
  },
  {
    id: 'ph',
    phase: 'Theory',
    title: 'pH & the pink dye',
    teach:
      "pH measures acidity: below 7 is acidic, 7 is neutral, above 7 is basic (pH = –log[H⁺]). We add a few drops of phenolphthalein — a dye that's colourless in acid but turns pink in base. So while any acid is left it stays clear; the first lasting pink means the acid is all used up.",
    points: [
      'pH = -log[H+]; pH 7 is neutral, lower is acidic, higher is basic',
      'phenolphthalein is colourless in acid and pink in base (changes around pH 8–9.6)',
      'for a strong acid + strong base the pH jumps so steeply that the colour change marks the equivalence point',
      'a strong-acid / strong-base equivalence point is exactly pH 7',
    ],
    formula: ['pH = − log [H⁺]', 'pH < 7  acidic   ·   7  neutral   ·   > 7  basic'],
  },
  {
    id: 'setup',
    phase: 'Setup',
    title: 'Setting up the apparatus',
    teach:
      "Here's our setup: 10.00 mL of the unknown HCl sits in the flask, diluted with water, with 3 drops of phenolphthalein. Above it the burette is filled with 0.100 M NaOH, set right at the 0.00 mL mark. Now we add the base slowly and watch the flask.",
    points: [
      '10.00 mL of HCl is pipetted into the flask, diluted to ~100 mL, plus 3 drops of phenolphthalein',
      'the burette is filled with 0.100 M NaOH with the meniscus at the 0.00 mL mark',
      'a white tile under the flask makes the colour change easy to see',
    ],
  },
  {
    id: 'start',
    phase: 'Your turn',
    title: 'Start the titration',
    teach:
      'Your turn! Press “Add 1 mL” to open the stopcock and run in about 6 mL of NaOH. Where each splash lands you\'ll see a flash of pink that quickly fades as it mixes — that\'s normal, the acid is still winning.',
    points: [
      'press the “Add 1 mL” button to dispense NaOH',
      'add roughly 6 mL for now',
      'pink flashes appear and fade because the acid is still in excess',
    ],
    action: { prompt: 'Add NaOH up to about 6 mL', gate: (v) => v >= 6 },
  },
  {
    id: 'approach',
    phase: 'Your turn',
    title: 'Slow down near the end',
    teach:
      "We're getting close now. From about 9 mL, switch to single drops with “Add drop”. You'll notice the pink takes longer and longer to fade — that means almost all the acid is gone. Go gently so you don't overshoot.",
    points: [
      'near 9 mL, switch to single drops using the “Add drop” button',
      'the pink fades more and more slowly as the acid runs out',
      'add drop by drop so you do not overshoot the endpoint',
    ],
    action: { prompt: 'Add dropwise toward ~9–10 mL', gate: (v) => v >= 9 },
  },
  {
    id: 'endpoint',
    phase: 'Your turn',
    title: 'The endpoint!',
    teach:
      "Watch closely — when a single drop turns the whole flask a faint pink that LASTS and doesn't fade, you've hit the endpoint! For a strong acid and strong base this equivalence point is exactly pH 7. Stop adding NaOH and read the burette.",
    points: [
      'the endpoint is the first faint pink that lasts (about 30 seconds)',
      'this is the equivalence point: moles of NaOH now equal moles of HCl',
      'strong acid + strong base means the equivalence point is at pH 7',
      'stop adding NaOH and note the burette reading',
    ],
    action: {
      prompt: 'Reach the lasting-pink endpoint (~10 mL)',
      gate: (v, status) => status === 'endpoint' || status === 'over',
    },
  },
  {
    id: 'curve',
    phase: 'Analysis',
    title: 'Reading the curve',
    teach:
      'Look at the titration curve on the left. See how the pH crept up slowly, then shot up almost straight at the endpoint? That steep jump is the giveaway: its steepest point is the equivalence point, and the volume there is the NaOH we used. A pH meter finds the endpoint exactly this way.',
    points: [
      'the curve rises slowly, then jumps almost vertically at the equivalence point',
      'the steepest point of the curve marks the endpoint volume of NaOH',
      'a pH meter locates the endpoint from this steep jump; we used the colour change instead',
    ],
    highlightCurve: true,
  },
  {
    id: 'calc',
    phase: 'Calculate',
    title: 'Find the concentration',
    teach:
      'Now the magic. At equivalence, moles of NaOH equal moles of HCl, which gives us M₁V₁ = M₂V₂. We know M₁ (NaOH) = 0.100 M, your V₁ from the burette, and V₂ (HCl) = 10.00 mL. Rearrange for M₂ and plug in YOUR numbers:',
    points: [
      'at equivalence, moles of NaOH = moles of HCl, so M1V1 = M2V2',
      'M1 = 0.100 M NaOH, V1 = the student’s burette reading, V2 = 10.00 mL of HCl',
      'rearrange to M(HCl) = (0.100 × V(NaOH)) ÷ 10.00',
      'use the student’s actual measured volume of NaOH',
    ],
    formula: (rd) => [
      'M₁V₁ = M₂V₂      ( ₁ = NaOH,  ₂ = HCl )',
      'M(HCl) = M(NaOH) × V(NaOH) ÷ V(HCl)',
      `M(HCl) = ( 0.100 × ${rd.naohVolumeMl.toFixed(2)} ) ÷ 10.00`,
      `M(HCl) = ${rd.hclMolarity} mol/L`,
    ],
  },
  {
    id: 'wrap',
    phase: 'Wrap-up',
    title: 'You did it! 🎉',
    teach:
      'Brilliant work! You discovered the unknown HCl is about 0.1 mol/L — roughly the strength of the acid in your own stomach (pH 1–3). You just ran a real analytical-chemistry experiment from start to finish. Press “Generate Lab Report” to write it up for your record.',
    points: [
      'the unknown HCl is about 0.1 mol/L',
      'that is close to the concentration of human stomach acid (pH 1–3)',
      'encourage the student to generate their lab report now',
    ],
  },
]
