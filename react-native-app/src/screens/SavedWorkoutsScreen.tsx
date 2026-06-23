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

import { ActionButton } from "../components/ActionButton"
import {
  clearSavedWorkouts,
  readSavedWorkouts,
  removeSavedWorkout,
  writeSavedWorkouts,
} from "../storage/savedWorkouts"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { makeStyles } from "./stylesheets/SavedWorkoutsScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "SavedWorkouts">

export function SavedWorkoutsScreen({ navigation, route }: Props) {
  const isDark = route.params?.isDark ?? false
  const styles = useMemo(() => makeStyles(isDark), [isDark])
  const [saved, setSaved] = useState<Workout[]>([])

  useFocusEffect(
    useCallback(() => {
      let active = true
      readSavedWorkouts()
        .then((items) => {
          if (active) setSaved(items)
        })
        .catch(() => {
          // Keep current list if storage is unavailable.
        })
      return () => {
        active = false
      }
    }, []),
  )

  function onChangeField(id: string, field: "sets" | "reps", text: string): void {
    const digits = text.replace(/[^0-9]/g, "")
    const value = digits === "" ? undefined : Number(digits)
    setSaved((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    )
  }

  function persist(): void {
    writeSavedWorkouts(saved).catch(() => {
      Alert.alert("Save failed", "Could not update local storage.")
    })
  }

  function onDelete(item: Workout): void {
    Alert.alert(
      "Delete workout?",
      `Remove "${item.name}" from your saved workouts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const next = await removeSavedWorkout(item.id)
              setSaved(next)
            } catch {
              Alert.alert("Delete failed", "Could not update local storage.")
            }
          },
        },
      ],
    )
  }

  function onClearAll(): void {
    Alert.alert(
      "Clear all saved workouts?",
      "This removes every saved workout from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearSavedWorkouts()
              setSaved([])
            } catch {
              Alert.alert("Clear failed", "Could not clear saved workouts.")
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.heading}>Saved Workouts</Text>
        </View>

        {saved.length ? (
          <Text style={styles.helperText}>
            Set the number of sets and reps for each saved workout.
          </Text>
        ) : (
          <Text style={styles.helperText}>
            No saved workouts yet. Find a workout on the training screen and tap
            Save.
          </Text>
        )}

        {saved.map((item) => (
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
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sets</Text>
                <TextInput
                  style={styles.numberInput}
                  value={item.sets != null ? String(item.sets) : ""}
                  onChangeText={(text) => onChangeField(item.id, "sets", text)}
                  onEndEditing={persist}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                  maxLength={3}
                  accessibilityLabel={`Sets for ${item.name}`}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.numberInput}
                  value={item.reps != null ? String(item.reps) : ""}
                  onChangeText={(text) => onChangeField(item.id, "reps", text)}
                  onEndEditing={persist}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                  maxLength={3}
                  accessibilityLabel={`Reps for ${item.name}`}
                />
              </View>
            </View>
          </View>
        ))}

        {saved.length ? (
          <ActionButton
            label="Clear Workouts"
            variant="accent"
            onPress={onClearAll}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
