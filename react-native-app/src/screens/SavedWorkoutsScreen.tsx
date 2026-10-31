import { useCallback, useMemo, useState } from "react"
import { Alert } from "react-native"
import { useFocusEffect, usePreventRemove } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { CalendarView } from "../components/CalendarView"
import { DayView, type SetField } from "../components/DayView"
import {
  readSavedWorkouts,
  removeSavedWorkout,
  writeSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { readDarkMode, writeDarkMode } from "../storage/theme"
import { getPalette } from "../theme"
import { formatDateLabel, todayKey } from "../utils/date"

type Props = NativeStackScreenProps<RootStackParamList, "SavedWorkouts">

type ViewMode = "day" | "calendar"

export function SavedWorkoutsScreen({ route, navigation }: Props) {
  // Starts from Training's setting; the cog menus can change it.
  const [isDark, setIsDark] = useState<boolean>(route.params?.isDark ?? false)
  const accent = getPalette(isDark).accent

  const [map, setMap] = useState<SavedWorkoutsByDate>({})
  // The day and calendar views are modes of this one screen, so the navigator
  // never sees moves between them. Their back history is kept here instead:
  // the last entry is the view on screen.
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([
    route.params?.initialView ?? "day",
  ])
  const viewMode = viewHistory[viewHistory.length - 1]
  const showView = (mode: ViewMode) => setViewHistory((prev) => [...prev, mode])
  const [selectedDate, setSelectedDate] = useState<string>(todayKey())

  // Dark mode can also be changed from Workout Detail's menu while this screen
  // stays mounted underneath, so re-read it whenever it comes back into focus.
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

  // While there's a previous view, going back (the day view's back button,
  // Android's back button, iOS's back swipe) returns to it instead of leaving
  // the screen. Other ways out, like the Training buttons, go ahead.
  usePreventRemove(viewHistory.length > 1, ({ data }) => {
    if (data.action.type === "GO_BACK" || data.action.type === "POP") {
      setViewHistory((prev) => prev.slice(0, -1))
    } else {
      navigation.dispatch(data.action)
    }
  })

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
      onBack={() => navigation.goBack()}
      onOpenCalendar={() => showView("calendar")}
      onOpenWorkout={(workout) => navigation.navigate("WorkoutDetail", { workout, isDark })}
      onDelete={onDelete}
      onChangeSet={onChangeSet}
      onSaveSets={() => persist(map)}
    />
  )
}
