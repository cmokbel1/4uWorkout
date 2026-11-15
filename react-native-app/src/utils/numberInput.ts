// Rules and helpers for the reps and weight fields (day view and the save
// dialog).

// How a number field can be filled: up to `wholeDigits` digits before the
// point, and `decimals` places after it (0 for whole numbers).
export interface NumberRules {
  wholeDigits: number
  decimals: number
}

// Reps are whole numbers up to 999; weights go up to 9999.99 lb (2 places
// covers 22.5 and 1.25 lb plates).
export const SET_INPUT_RULES = {
  reps: { wholeDigits: 3, decimals: 0 },
  weight: { wholeDigits: 4, decimals: 2 },
} as const satisfies Record<"reps" | "weight", NumberRules>

// The longest text a field can hold, for its maxLength (e.g. "9999.99").
export function maxLengthFor(rules: NumberRules): number {
  return rules.wholeDigits + (rules.decimals ? 1 + rules.decimals : 0)
}

// The largest value a field can hold (e.g. 999, 9999.99), which the steppers
// stop at.
export function maxValueFor(rules: NumberRules): number {
  return roundTo(10 ** rules.wholeDigits - 10 ** -rules.decimals, rules.decimals)
}

// Cleans typed or pasted text for a number field: digits, cut at the first
// decimal point for whole numbers and at a second one for decimals (so a
// pasted "3.5" in reps is 3, not 35), then trimmed to the rules' digits. A
// comma counts as the point, since some locales' decimal keypads type one.
export function cleanNumberInput(text: string, rules: NumberRules): string {
  const [whole, fraction] = text.replace(/,/g, ".").replace(/[^0-9.]/g, "").split(".")
  const wholeDigits = whole.slice(0, rules.wholeDigits)
  if (!rules.decimals || fraction === undefined) return wholeDigits
  return `${wholeDigits}.${fraction.slice(0, rules.decimals)}`
}

// The number in a cleaned field, or undefined when it holds none ("" or ".").
export function parseNumberInput(text: string): number | undefined {
  return text === "" || text === "." ? undefined : Number(text)
}

// Rounds to `decimals` places, so stepping a decimal weight doesn't pick up
// floating-point noise (e.g. 0.1 + 0.2 = 0.30000000000000004).
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
