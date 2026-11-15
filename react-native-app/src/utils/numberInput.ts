// Helpers for the reps and weight fields (day view and the save dialog).

// Cleans typed or pasted text for a number field: digits, plus (when
// `decimals` > 0) one decimal point with at most that many digits after it.
// A comma becomes a point, since some locales' decimal keypads type one.
export function cleanNumberInput(text: string, decimals: number): string {
  const digitsAndPoints = text.replace(/,/g, ".").replace(/[^0-9.]/g, "")
  if (decimals === 0) return digitsAndPoints.replace(/\./g, "")
  const [whole, ...fraction] = digitsAndPoints.split(".")
  return fraction.length ? `${whole}.${fraction.join("").slice(0, decimals)}` : whole
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
