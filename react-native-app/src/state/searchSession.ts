import type { Workout } from "../types/workout"

// In-memory (NOT persisted) snapshot of the Search screen, like
// trainingSession: the screen can be remounted when the user comes back to it,
// which would otherwise wipe the query, results and the workout on show. It
// hydrates from here on mount and writes back on change. Reset only on a full
// JS reload — session-only by design, deliberately not AsyncStorage.
//
// `suggestions` is fetched once per session (null until then), so a remount
// doesn't spend a request against the server's rate limit.
export const searchSession: {
  query: string
  resultsQuery: string
  results: Workout[]
  currentWorkout: Workout | null
  suggestions: string[] | null
} = {
  query: "",
  resultsQuery: "",
  results: [],
  currentWorkout: null,
  suggestions: null,
}
