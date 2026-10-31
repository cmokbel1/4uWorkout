// Date-key helpers for the date-keyed saved-workouts store. Keys are local
// calendar days in `YYYY-MM-DD` form (not UTC) so a workout saved at 11pm
// lands on the day the user actually saved it.

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

// Human label for a date key, e.g. "Today" or "Thu, Jun 26". Parses the key
// as a local date (avoids the UTC shift of `new Date("YYYY-MM-DD")`).
export function formatDateLabel(key: string): string {
  if (key === todayKey()) return "Today"
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
