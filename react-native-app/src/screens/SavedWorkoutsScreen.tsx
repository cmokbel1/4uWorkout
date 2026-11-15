import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { CalendarView } from "../components/CalendarView"
import { DayView } from "../components/DayView"
import type { SavedView } from "../components/SavedViewSwitch"
import type { SetField } from "../components/WorkoutCard"
import { useTabBarTheme } from "../hooks/useTabBarTheme"
import { getExerciseById } from "../services/workoutApi"
import {
  deleteRoutine,
  overwriteRoutine,
  readRoutines,
  saveRoutineFromDay,
} from "../storage/routines"
import {
  latestSavedCopy,
  readSavedWorkouts,
  removeSavedWorkout,
  withDayTagged,
  withRoutineAdded,
  writeSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
import type { Routine } from "../types/routine"
import type { Workout } from "../types/workout"
import type { RootStackParamList, TabParamList } from "../../App"
import { getLastKnownDarkMode, readDarkMode, writeDarkMode } from "../storage/theme"
import { getPalette } from "../theme"
import { formatDateLabel, todayKey } from "../utils/date"

// A tab, but it opens Workout Detail on the root stack above the tabs.
type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "SavedWorkouts">,
  NativeStackScreenProps<RootStackParamList>
>

// The Saved tab: the day view and the calendar.
export function SavedWorkoutsScreen({ navigation }: Props) {
  // Re-read on focus below; this avoids flashing the light theme first. The
  // cog menus can change it.
  const [isDark, setIsDark] = useState<boolean>(getLastKnownDarkMode)
  const palette = getPalette(isDark)
  const accent = palette.accent
  useTabBarTheme(palette)

  const [map, setMap] = useState<SavedWorkoutsByDate>({})
  const [routines, setRoutines] = useState<Routine[]>([])
  // The day and calendar views are two views of this one screen, picked with
  // the Day | Calendar switch under the header of each; the navigator never
  // sees moves between them, and they keep no back history.
  const [viewMode, setViewMode] = useState<SavedView>("day")
  const [selectedDate, setSelectedDate] = useState<string>(todayKey())

  // Dark mode can also be changed from another tab's or Workout Detail's menu
  // while this screen stays mounted, so re-read it whenever it regains focus.
  useFocusEffect(
    useCallback(() => {
      readDarkMode()
        .then(setIsDark)
        .catch(() => {
          // Keep the current theme if the preference can't be read.
        })
    }, []),
  )

  useFocusEffect(
    useCallback(() => {
      let active = true
      readSavedWorkouts()
        .then((items) => {
          if (active) setMap(items)
        })
        .catch(() => {
          // Keep current data if storage is unavailable.
        })
      readRoutines()
        .then((items) => {
          if (active) setRoutines(items)
        })
        .catch(() => {
          // Keep current routines if storage is unavailable.
        })
      return () => {
        active = false
      }
    }, []),
  )

  const dayWorkouts = map[selectedDate] ?? []

  // Days that have at least one workout get a dot; the selected day is
  // highlighted. Built from the same map the day view reads.
  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {}
    for (const [date, list] of Object.entries(map)) {
      if (list.length) marks[date] = { marked: true, dotColor: accent }
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: accent,
    }
    return marks
  }, [map, selectedDate, accent])

  function persist(next: SavedWorkoutsByDate): void {
    writeSavedWorkouts(next).catch(() => {
      Alert.alert("Save failed", "Could not update local storage.")
    })
  }

  // Updates one set on the selected day. Stepper taps save straight away;
  // typed values are saved when editing ends (onSaveSets).
  function onChangeSet(
    workoutId: string,
    setIndex: number,
    field: SetField,
    value: number | undefined,
    save: boolean,
  ): void {
    const next: SavedWorkoutsByDate = {
      ...map,
      [selectedDate]: (map[selectedDate] ?? []).map((w) =>
        w.id === workoutId
          ? {
              ...w,
              setDetails: (w.setDetails ?? []).map((set, i) =>
                i === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : w,
      ),
    }
    setMap(next)
    if (save) persist(next)
  }

  // Sets or clears one workout's note on the selected day and saves it.
  function onChangeNote(workoutId: string, note: string | undefined): void {
    const next: SavedWorkoutsByDate = {
      ...map,
      [selectedDate]: (map[selectedDate] ?? []).map((w) =>
        w.id === workoutId ? { ...w, note } : w,
      ),
    }
    setMap(next)
    persist(next)
  }

  function onToggleDark(value: boolean): void {
    setIsDark(value)
    writeDarkMode(value).catch(() => {
      // Non-fatal: the toggle still applies for this session.
    })
  }

  function onDelete(item: Workout): void {
    Alert.alert(
      "Delete workout?",
      `Remove "${item.name}" from ${formatDateLabel(selectedDate)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const next = await removeSavedWorkout(selectedDate, item.id)
              setMap(next)
            } catch {
              Alert.alert("Delete failed", "Could not update local storage.")
            }
          },
        },
      ],
    )
  }

  // Saves the selected day's workouts as a new routine and links the day to
  // it, so later changes to the day offer to update that routine.
  async function onSaveRoutine(name: string): Promise<void> {
    let next: Routine[]
    try {
      next = await saveRoutineFromDay(name, dayWorkouts)
    } catch {
      Alert.alert("Save failed", "Could not write to local storage.")
      return
    }
    setRoutines(next)
    const tagged = withDayTagged(map, selectedDate, next[0].id)
    setMap(tagged)
    persist(tagged)
  }

  // Replaces a routine's exercises with the selected day's workouts, and
  // links the day's workouts (including ones added since) to it.
  async function onOverwriteRoutine(routine: Routine): Promise<void> {
    try {
      setRoutines(await overwriteRoutine(routine.id, dayWorkouts))
    } catch {
      Alert.alert("Save failed", "Could not write to local storage.")
      return
    }
    const tagged = withDayTagged(map, selectedDate, routine.id)
    setMap(tagged)
    persist(tagged)
  }

  // Adds a routine's exercises to the selected day with blank sets. Each is
  // copied from its newest saved copy; one that's no longer saved on any day
  // is downloaded, and left out if that fails.
  async function onAddRoutine(routine: Routine): Promise<void> {
    const copies = new Map<string, Workout>()
    const missing: string[] = []
    for (const { id } of routine.exercises) {
      const copy = latestSavedCopy(map, id)
      if (copy) copies.set(id, copy)
      else missing.push(id)
    }
    const fetched = await Promise.allSettled(missing.map((id) => getExerciseById(id)))
    fetched.forEach((result, i) => {
      if (result.status === "fulfilled") copies.set(missing[i], result.value)
    })

    const next = withRoutineAdded(map, selectedDate, routine, copies)
    if (next !== map) {
      setMap(next)
      persist(next)
    }
    const failed = fetched.filter((result) => result.status === "rejected").length
    if (failed) {
      Alert.alert(
        "Some exercises weren't added",
        `${failed} of the exercises in "${routine.name}" aren't saved on any day any more and couldn't be downloaded. Check your connection and add the routine again.`,
      )
    }
  }

  function onDeleteRoutine(routine: Routine): void {
    Alert.alert(
      "Delete routine?",
      `Delete "${routine.name}"? Workouts already added from it stay on their days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setRoutines(await deleteRoutine(routine.id))
            } catch {
              Alert.alert("Delete failed", "Could not update local storage.")
            }
          },
        },
      ],
    )
  }

  if (viewMode === "calendar") {
    return (
      <CalendarView
        isDark={isDark}
        onToggleDark={onToggleDark}
        markedDates={markedDates}
        savedWorkouts={map}
        onSelectDate={(date) => {
          setSelectedDate(date)
          setViewMode("day")
        }}
        onChangeView={setViewMode}
      />
    )
  }

  return (
    <DayView
      isDark={isDark}
      onToggleDark={onToggleDark}
      date={selectedDate}
      workouts={dayWorkouts}
      savedWorkouts={map}
      onChangeView={setViewMode}
      onOpenToday={() => setSelectedDate(todayKey())}
      onOpenWorkout={(workout) => navigation.navigate("WorkoutDetail", { workout, isDark })}
      onDelete={onDelete}
      onChangeSet={onChangeSet}
      onSaveSets={() => persist(map)}
      onChangeNote={onChangeNote}
      routines={routines}
      onSaveRoutine={onSaveRoutine}
      onOverwriteRoutine={onOverwriteRoutine}
      onAddRoutine={onAddRoutine}
      onDeleteRoutine={onDeleteRoutine}
    />
  )
}
