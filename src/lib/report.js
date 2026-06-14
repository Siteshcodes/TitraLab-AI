/**
 * Local, deterministic lab report. Pure functions, no AI.
 *  - buildFallbackReport(runData): the report object rendered when Groq is
 *    unavailable or returns something malformed. Numbers are always correct.
 *  - reportToMarkdown(report): plain-text/markdown for the "Copy report" button.
 *
 * The shape here is the contract the AI must also return (see groq.js).
 */

export function buildFallbackReport(runData) {
  const {
    naohMolarity,
    naohVolumeMl,
    hclVolumeMl,
    hclMolarity,
    overshootMl,
    overTitrated,
  } = runData

  const result =
    `The concentration of the unknown hydrochloric acid (HCl) is ${hclMolarity} mol/L (${hclMolarity} M).` +
    (overTitrated
      ? ` Note: about ${overshootMl} mL of NaOH was added past the endpoint, so this value is slightly high — the titration should be repeated for a more accurate reading.`
      : '') +
    (runData.realWorld ? ` ${runData.realWorld}` : '')

  return {
    aim:
      'To determine the molar concentration of a hydrochloric acid (HCl) solution by ' +
      'titrating it against a standard 0.100 M sodium hydroxide (NaOH) solution, using ' +
      'phenolphthalein as the indicator.',
    apparatus: [
      'Burette (50 mL)',
      'Pipette (25 mL)',
      'Conical flask (250 mL)',
      'Burette stand with clamp',
      'White glazed tile',
      'Wash bottle of distilled water',
      'Standard 0.100 M sodium hydroxide (NaOH) solution',
      'Hydrochloric acid (HCl) of unknown concentration',
      'Phenolphthalein indicator',
    ],
    procedure: [
      'Rinse and fill the burette with the standard 0.100 M NaOH solution and record the initial reading.',
      `Pipette ${hclVolumeMl} mL of the unknown HCl solution into a clean conical flask.`,
      'Add 2–3 drops of phenolphthalein indicator to the acid in the flask; it stays colourless.',
      'Place the flask on a white tile under the burette and slowly run in NaOH, swirling continuously.',
      'As the endpoint nears, add NaOH drop by drop until one drop gives a permanent pale pink colour.',
      'Record the final burette reading and find the volume of NaOH used.',
    ],
    observationTable: {
      headers: [
        'Trial',
        'Initial reading (mL)',
        'Final reading (mL)',
        'Volume of NaOH used (mL)',
      ],
      rows: [['1', '0.0', naohVolumeMl.toFixed(1), naohVolumeMl.toFixed(1)]],
    },
    calculation: [
      'Reaction:  HCl + NaOH → NaCl + H₂O   (1 : 1 mole ratio)',
      'Using the titration formula:  M₁V₁ = M₂V₂',
      'where M₁, V₁ = NaOH (titrant)  and  M₂, V₂ = HCl (acid)',
      `M₁ (NaOH) = ${naohMolarity} M      V₁ (NaOH) = ${naohVolumeMl.toFixed(1)} mL`,
      `V₂ (HCl)  = ${hclVolumeMl.toFixed(1)} mL      M₂ (HCl) = ?`,
      `M₂ = (M₁ × V₁) ÷ V₂ = (${naohMolarity} × ${naohVolumeMl.toFixed(1)}) ÷ ${hclVolumeMl.toFixed(1)}`,
      `M₂ = ${hclMolarity} mol/L`,
    ],
    result,
    precautions: [
      'Read the burette at eye level from the bottom of the meniscus to avoid parallax error.',
      'Rinse the burette with NaOH and the pipette with HCl before filling.',
      'Swirl the flask constantly so the reaction mixes evenly.',
      'Add the last few drops slowly to avoid overshooting the endpoint.',
      'Remove any air bubble from the burette tip before starting.',
    ],
  }
}

// ── Markdown export for the Copy button ─────────────────────────────────────
export function reportToMarkdown(report, runData) {
  const lines = []
  lines.push('# Titration Lab Report')
  lines.push('## Experiment')
  lines.push(
    `Titration of unknown HCl against standard ${runData.naohMolarity} M NaOH (phenolphthalein indicator).`,
  )
  lines.push('')
  lines.push('## Aim')
  lines.push(report.aim)
  lines.push('')
  lines.push('## Apparatus')
  report.apparatus.forEach((a) => lines.push(`- ${a}`))
  lines.push('')
  lines.push('## Procedure')
  report.procedure.forEach((p, i) => lines.push(`${i + 1}. ${p}`))
  lines.push('')
  lines.push('## Observation Table')
  const t = report.observationTable
  lines.push(`| ${t.headers.join(' | ')} |`)
  lines.push(`| ${t.headers.map(() => '---').join(' | ')} |`)
  t.rows.forEach((r) => lines.push(`| ${r.join(' | ')} |`))
  lines.push('')
  lines.push('## Calculation')
  lines.push('```')
  report.calculation.forEach((c) => lines.push(c))
  lines.push('```')
  lines.push('')
  lines.push('## Result')
  lines.push(report.result)
  lines.push('')
  lines.push('## Precautions')
  report.precautions.forEach((p) => lines.push(`- ${p}`))
  lines.push('')
  return lines.join('\n')
}
