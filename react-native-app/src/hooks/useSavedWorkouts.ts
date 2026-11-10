import { useCallback, useRef, useState } from "react"
import { Alert } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import {
  addWorkoutForToday,
  getSavedWorkoutsVersion,
  readSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
import type { Workout, WorkoutSet } from "../types/workout"

// The saved workouts, for a screen that shows workouts and can save them
// (Training, Search). Loaded on the screen's first focus, then again on focus
// only when storage changed since (e.g. sets edited on the day view, or a save
// on another screen). Loading on the first focus matters: a remount
// (navigating back can remount a screen) would otherwise keep an empty map,
// leaving Save enabled for a workout already saved today.
export function useSavedWorkouts() {
  const [savedMap, setSavedMap] = useState<SavedWorkoutsByDate>({})
  // The storage version savedMap reflects; null until the first load.
  const loadedVersionRef = useRef<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      // Read before loading: a write during the load bumps it past this, so
      // the next focus loads again.
      const version = getSavedWorkoutsVersion()
      if (loadedVersionRef.current === version) return
      let active = true
      readSavedWorkouts()
        .then((map) => {
          if (active) {
            setSavedMap(map)
            loadedVersionRef.current = version
          }
        })
        .catch(() => {
          // Keep current list if storage is unavailable.
        })
      return () => {
        active = false
      }
    }, []),
  )

  // Saves under today's date with the sets from the save dialog. A workout
  // picked from the saved list still carries that day's note; a new save
  // starts without one. No alert on success: Save then reads "Saved".
  async function saveForToday(workout: Workout, setDetails: WorkoutSet[]): Promise<void> {
    try {
      const next = await addWorkoutForToday({ ...workout, setDetails, note: undefined })
      setSavedMap(next)
      // savedMap already reflects the write, so don't re-read on next focus.
      loadedVersionRef.current = getSavedWorkoutsVersion()
    } catch {
      Alert.alert("Save failed", "Could not write to local storage.")
    }
  }

  return { savedMap, saveForToday }
}
