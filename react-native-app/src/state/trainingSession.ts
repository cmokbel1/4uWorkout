import type { ExerciseFilters, FilterOptionsByBodyPart } from "../types/filters"
import type { Workout } from "../types/workout"

// In-memory (NOT persisted) snapshot of the last search. TrainingScreen is
// remounted when the user navigates back to it (native-stack + New Arch does
// not always preserve its state), which would otherwise wipe the randomized
// current workout and similar-workouts list. This module lives for the app's
// lifetime, so the screen hydrates from it on mount and writes to it on change.
// Overwritten on each new search; reset only on a full JS reload — session-only
// by design, deliberately not AsyncStorage.
//
// `filterOptions` is fetched once per session (null until then) so remounts
// don't refetch it. `filters` and `selectedBodyPart` are kept together: filter
// choices (target, equipment type) only make sense for the body part they
// were picked under.
export const trainingSession: {
  allResults: Workout[]
  searchResults: Workout[]
  currentWorkout: Workout | null
  filterOptions: FilterOptionsByBodyPart | null
  filters: ExerciseFilters
  selectedBodyPart: string
} = {
  allResults: [],
  searchResults: [],
  currentWorkout: null,
  filterOptions: null,
  filters: {},
  selectedBodyPart: "",
}
