import { StatusBar } from "expo-status-bar"
import { useCallback, useMemo, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Calendar } from "react-native-calendars"

import {
  readSavedWorkouts,
  removeSavedWorkout,
  writeSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { formatDateLabel, todayKey } from "../utils/date"
import {
  makeCalendarTheme,
  makeStyles,
  palette,
} from "./stylesheets/SavedWorkoutsScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "SavedWorkouts">

type ViewMode = "day" | "calendar"

export function SavedWorkoutsScreen({ route }: Props) {
  const isDark = route.params?.isDark ?? false
  const styles = useMemo(() => makeStyles(isDark), [isDark])
  const calendarTheme = useMemo(() => makeCalendarTheme(isDark), [isDark])
  const accent = palette(isDark).accent

  const [map, setMap] = useState<SavedWorkoutsByDate>({})
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [selectedDate, setSelectedDate] = useState<string>(todayKey())

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

  function onChangeSetField(
    workoutId: string,
    setIndex: number,
    field: "weight" | "reps",
    text: string,
  ): void {
    const digits = text.replace(/[^0-9]/g, "")
    const value = digits === "" ? undefined : Number(digits)
    setMap((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).map((w) =>
        w.id === workoutId
          ? {
              ...w,
              setDetails: (w.setDetails ?? []).map((set, i) =>
                i === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : w,
      ),
    }))
  }

  function persist(): void {
    writeSavedWorkouts(map).catch(() => {
      Alert.alert("Save failed", "Could not update local storage.")
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable
            onPress={() => setViewMode("day")}
            style={styles.toggleButton}
            accessibilityLabel="Back to workouts"
            accessibilityRole="button"
          >
            <Text style={styles.toggleButtonText}>‹ back</Text>
          </Pressable>
          <Text style={styles.heading}>Select a date</Text>
          <View style={styles.calendarCard}>
            <Calendar
              current={todayKey()}
              markedDates={markedDates}
              onDayPress={(day:any) => {
                setSelectedDate(day.dateString)
                setViewMode("day")
              }}
              theme={calendarTheme}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => setViewMode("calendar")}
          style={styles.toggleButton}
          accessibilityLabel="View calendar"
          accessibilityRole="button"
        >
          <Text style={styles.toggleButtonText}>‹ view calendar</Text>
        </Pressable>
        <Text style={styles.heading}>{formatDateLabel(selectedDate)}</Text>

        {dayWorkouts.length ? (
          <Text style={styles.helperText}>
            Set the number of sets and reps for each workout.
          </Text>
        ) : (
          <Text style={styles.helperText}>
            No workouts saved on this day. Tap "view calendar" to pick another
            day, or find a workout on the training screen to save for today.
          </Text>
        )}

        {dayWorkouts.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Pressable
                onPress={() => onDelete(item)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
                accessibilityLabel={`Delete ${item.name}`}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
            {(item.setDetails ?? []).map((set, index) => (
              <View key={index} style={styles.setRow}>
                <Text style={styles.setRowLabel}>Set {index + 1}</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Weight (lbs)</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={set.weight != null ? String(set.weight) : ""}
                      onChangeText={(text) =>
                        onChangeSetField(item.id, index, "weight", text)
                      }
                      onEndEditing={persist}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                      maxLength={4}
                      accessibilityLabel={`Weight for set ${index + 1} of ${item.name}`}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={set.reps != null ? String(set.reps) : ""}
                      onChangeText={(text) =>
                        onChangeSetField(item.id, index, "reps", text)
                      }
                      onEndEditing={persist}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                      maxLength={3}
                      accessibilityLabel={`Reps for set ${index + 1} of ${item.name}`}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
