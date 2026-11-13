import { useCallback, useMemo, useState } from "react"
import { Alert, BackHandler } from "react-native"
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { useFocusEffect, type CompositeScreenProps } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { CalendarView } from "../components/CalendarView"
import { DayView, type SetField } from "../components/DayView"
import { useTabBarTheme } from "../hooks/useTabBarTheme"
import {
  readSavedWorkouts,
  removeSavedWorkout,
  writeSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
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

type ViewMode = "day" | "calendar"

// The Saved tab: the day view ("Today's workouts") and the calendar.
export function SavedWorkoutsScreen({ navigation }: Props) {
  // Re-read on focus below; this avoids flashing the light theme first. The
  // cog menus can change it.
  const [isDark, setIsDark] = useState<boolean>(getLastKnownDarkMode)
  const palette = getPalette(isDark)
  const accent = palette.accent
  useTabBarTheme(palette)

  const [map, setMap] = useState<SavedWorkoutsByDate>({})
  // The day and calendar views are modes of this one screen, so the navigator
  // never sees moves between them. Their back history is kept here instead:
  // the last entry is the view on screen.
  const [viewHistory, setViewHistory] = useState<ViewMode[]>(["day"])
  const viewMode = viewHistory[viewHistory.length - 1]
  const showView = (mode: ViewMode) => setViewHistory((prev) => [...prev, mode])
  const hasPreviousView = viewHistory.length > 1
  const showPreviousView = () => setViewHistory((prev) => prev.slice(0, -1))
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
      return () => {
        active = false
      }
    }, []),
  )

  // While there's a previous view, the header's back button and Android's
  // back button return to it. (A tab is never removed, so this can't be done
  // by intercepting the screen being closed.) With none, Android's back
  // button does what the tabs do: back to the first tab.
  useFocusEffect(
    useCallback(() => {
      if (!hasPreviousView) return
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        setViewHistory((prev) => prev.slice(0, -1))
        return true
      })
      return () => subscription.remove()
    }, [hasPreviousView]),
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

  if (viewMode === "calendar") {
    return (
      <CalendarView
        isDark={isDark}
        onToggleDark={onToggleDark}
        markedDates={markedDates}
        savedWorkouts={map}
        onBack={hasPreviousView ? showPreviousView : undefined}
        onSelectDate={(date) => {
          setSelectedDate(date)
          showView("day")
        }}
        onOpenToday={() => {
          setSelectedDate(todayKey())
          showView("day")
        }}
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
      onBack={hasPreviousView ? showPreviousView : undefined}
      onOpenCalendar={() => showView("calendar")}
      onOpenWorkout={(workout) => navigation.navigate("WorkoutDetail", { workout, isDark })}
      onDelete={onDelete}
      onChangeSet={onChangeSet}
      onSaveSets={() => persist(map)}
      onChangeNote={onChangeNote}
    />
  )
}
