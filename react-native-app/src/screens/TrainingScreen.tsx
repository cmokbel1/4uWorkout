import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Picker } from "@react-native-picker/picker"

import { ActionButton } from "../components/ActionButton"
import { FALLBACK_TARGET_AREAS } from "../constants/targetAreas"
import {
  getAllowedBodyParts,
  getExerciseImageById,
  searchExercisesByBodyPart,
} from "../services/workoutApi"
import {
  clearSavedWorkouts,
  readSavedWorkouts,
  writeSavedWorkouts,
} from "../storage/savedWorkouts"
import type { Workout } from "../types/workout"
import { getErrorMessage, toTitleCase } from "../utils/formatting"

export function TrainingScreen() {
  const scrollViewRef = useRef<ScrollView>(null)
  const workoutPanelRef = useRef<View>(null)

  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [bodyPartOptions, setBodyPartOptions] = useState<string[]>([])
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("")
  const [targetAreaOptions, setTargetAreaOptions] = useState<string[]>(
    FALLBACK_TARGET_AREAS,
  )
  const [selectedTargetArea, setSelectedTargetArea] = useState<string>(
    targetAreaOptions[0],
  )
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false)
  const [allResults, setAllResults] = useState<Workout[]>([])
  const [searchResults, setSearchResults] = useState<Workout[]>([])
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      try {
        const existing = await readSavedWorkouts()
        setSavedWorkouts(existing)
      } catch {
        // Keep empty list if storage is unavailable.
      }

      try {
        const allowedBodyParts = await getAllowedBodyParts()
        if (allowedBodyParts.length) {
          setBodyPartOptions(allowedBodyParts)
          setSelectedBodyPart(allowedBodyParts[0])
        }
      } catch {
        // Keep fallback options when endpoint is unavailable.
      }
    }

    bootstrap()
  }, [])

  async function onSearchWorkout(): Promise<void> {
    if (!selectedBodyPart) {
      Alert.alert("Body part required", "Select a body part before searching.")
      return
    }

    setIsSearching(true)
    try {
      const results = await searchExercisesByBodyPart(selectedBodyPart)
      if (!results.length) {
        Alert.alert("No workouts found", "Try a different body part.")
        return
      }
      const shuffled = [...results]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      const selected = shuffled[Math.floor(Math.random() * shuffled.length)]
      setAllResults(shuffled)
      setSearchResults(shuffled.filter((w) => w.id !== selected.id))
      await getImageAndUpdateWorkoutState(selected)
    } catch (error: unknown) {
      Alert.alert("Search failed", getErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  function scrollToWorkoutPanel(): void {
    workoutPanelRef.current?.measureLayout(
      scrollViewRef.current?.getInnerViewNode(),
      (_, y) => scrollViewRef.current?.scrollTo({ y, animated: true }),
      () => {},
    )
  }

  function onSelectSimilarWorkout(item: Workout): void {
    const pool = [...allResults]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setSearchResults(pool.filter((w) => w.id !== item.id))
    getImageAndUpdateWorkoutState(item)
  }

  async function getImageAndUpdateWorkoutState(
    workout: Workout,
  ): Promise<void> {
    setIsSearching(true)
    scrollToWorkoutPanel()
    await getExerciseImageById(workout.id)
      .then((imageUrl) => {
        setCurrentWorkout({ ...workout, gifUrl: imageUrl })
      })
      .catch((error) => {
        console.error("Failed to fetch image for workout:", workout.id, error)
      })
      .finally(() => {
        setIsSearching(false)
      })
  }

  async function onClearWorkouts(): Promise<void> {
    try {
      await clearSavedWorkouts()
      setSavedWorkouts([])
      Alert.alert("Cleared", "All saved workouts have been removed.")
    } catch {
      Alert.alert(
        "Clear failed",
        "Could not clear saved workouts from local storage.",
      )
    }
  }
  async function onSaveWorkout(): Promise<void> {
    if (!currentWorkout) {
      Alert.alert("No workout selected", "Find a workout before saving.")
      return
    }

    if (savedWorkouts.some((w) => w.id === currentWorkout.id)) {
      Alert.alert(
        "Already saved",
        "This workout is already in your saved list.",
      )
      return
    }

    const nextSaved = [currentWorkout, ...savedWorkouts].slice(0, 50)
    setSavedWorkouts(nextSaved)

    try {
      await writeSavedWorkouts(nextSaved)
      Alert.alert("Saved", "Workout added to your saved list.")
    } catch {
      Alert.alert("Save failed", "Could not write to local storage.")
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
        <Text style={styles.heading}>4UWorkout Trainer</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select a Body Part</Text>
          <Text style={styles.fieldLabel}>Find a workout for:</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedBodyPart}
              onValueChange={(value) => setSelectedBodyPart(String(value))}
              dropdownIconColor="#DDE6F6"
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {bodyPartOptions.map((bodyPart) => (
                <Picker.Item
                  key={bodyPart}
                  label={toTitleCase(bodyPart)}
                  value={bodyPart}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.row}>
            <ActionButton
              label="Find"
              onPress={onSearchWorkout}
              disabled={isSearching}
            />
            <ActionButton
              label="Save Workout"
              variant="accent"
              onPress={onSaveWorkout}
              disabled={isSearching}
            />
          </View>

          {currentWorkout ? (
            <View ref={workoutPanelRef} style={styles.workoutPanelWrap}>
              <View style={styles.workoutPanel}>
                <Text style={styles.detailLabel}>
                  Workout: {currentWorkout.name}
                </Text>
                <Text style={styles.detailLabel}>
                  Target: {currentWorkout.target}
                </Text>
                <Text style={styles.detailLabel}>
                  Muscle Group: {currentWorkout.bodyPart}
                </Text>
                <Text style={styles.detailLabel}>
                  Equipment: {currentWorkout.equipment}
                </Text>
                <Text style={styles.difficulty && VARIANT_STYLES[currentWorkout.difficulty as DifficultyVariant]}>
                  Difficulty: {currentWorkout.difficulty}
                </Text>
                <Image
                  source={{ uri: currentWorkout.gifUrl }}
                  style={styles.mediaImage}
                  resizeMode="contain"
                />
                <Text style={styles.detailLabel}>
                  Description: {currentWorkout.description}
                </Text>
                <Pressable
                  style={styles.instructionsButton}
                  onPress={() => setInstructionsVisible(true)}
                  accessibilityLabel="View instructions"
                  accessibilityRole="button"
                >
                  <Text style={styles.instructionsButtonText}>Instructions</Text>
                </Pressable>
              </View>
              <Modal
                visible={instructionsVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setInstructionsVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Instructions</Text>
                    <ScrollView style={styles.modalBody}>
                      <Text style={styles.modalText}>{currentWorkout.instructions}</Text>
                    </ScrollView>
                    <Pressable
                      style={styles.modalClose}
                      onPress={() => setInstructionsVisible(false)}
                      accessibilityLabel="Close instructions"
                      accessibilityRole="button"
                    >
                      <Text style={styles.modalCloseText}>Close</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
              {isSearching && (
                <View style={styles.workoutPanelOverlay}>
                  <ActivityIndicator color="#4A5568" />
                </View>
              )}
            </View>
          ) : isSearching ? (
            <ActivityIndicator
              color="#4A5568"
              style={styles.loadingIndicator}
            />
          ) : (
            <Text style={styles.helperText}>
              Choose a body part and tap Find.
            </Text>
          )}

          <Text style={styles.savedTitle}>Similar Workouts</Text>
          <Text style={styles.fieldLabel}>
            Select a workout for more information
          </Text>
          {searchResults.length ? (
            searchResults.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectSimilarWorkout(item)}
                style={styles.resultItem}
                accessibilityLabel={`Select ${item.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.resultItemText}>
                  {idx + 1}. {item.name}
                </Text>
                <Text style={styles.resultItemSubtext}>
                  Target: {item.target}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.helperText}>No workouts loaded yet.</Text>
          )}

          <Text style={styles.savedTitle}>Saved Training Log</Text>
          {savedWorkouts.length ? (
            savedWorkouts.map((item, idx) => (
              <Text style={styles.savedItem} key={item.id}>
                {idx + 1}. {item.name} ({item.target})
              </Text>
            ))
          ) : (
            <Text style={styles.helperText}>No saved workouts yet.</Text>
          )}
          {savedWorkouts.length ? (
            <ActionButton
              label="Clear Workouts"
              variant="accent"
              onPress={onClearWorkouts}
              disabled={isSearching}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )

}

type DifficultyVariant = 'beginner' | 'intermediate' | 'advanced';
const VARIANT_STYLES: Record<DifficultyVariant, { color: string }> = {
  beginner: { color: 'green' },
  intermediate: { color: 'orange' },
  advanced: { color: 'red' },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    padding: 18,
    gap: 16,
  },
  heading: {
    color: "#1A2333",
    fontSize: 28,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8DFE9",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    color: "#1A2333",
    fontSize: 20,
    fontWeight: "700",
  },
  fieldLabel: {
    color: "#4A5568",
    fontWeight: "600",
    marginBottom: -6,
  },
  difficulty: {
    fontWeight: "700",
    textTransform: "capitalize",
    fontSize: 16,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#C9D3E0",
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
  },
  picker: {
    color: "#1A2333",
  },
  pickerItem: {
    color: "#1A2333",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loadingIndicator: {
    alignSelf: "center",
  },
  workoutPanelWrap: {
    position: "relative",
  },
  workoutPanel: {
    gap: 8,
  },
  workoutPanelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(244, 246, 250, 0.80)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    color: "#2D3748",
    textTransform: "capitalize",
  },
  mediaImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
  },
  helperText: {
    color: "#718096",
  },
  savedTitle: {
    marginTop: 6,
    color: "#1A2333",
    fontWeight: "700",
  },
  savedItem: {
    color: "#4A5568",
  },
  resultItem: {
    borderWidth: 1,
    borderColor: "#C9D3E0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    gap: 2,
  },
  resultItemText: {
    color: "#1A2333",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  resultItemSubtext: {
    color: "#718096",
    textTransform: "capitalize",
  },
  instructionsButton: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF1F6",
    borderWidth: 1,
    borderColor: "#C9D3E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  instructionsButtonText: {
    color: "#3B6FD4",
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxHeight: "70%",
    gap: 12,
  },
  modalTitle: {
    color: "#1A2333",
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    flexShrink: 1,
  },
  modalText: {
    color: "#2D3748",
    lineHeight: 22,
  },
  modalClose: {
    backgroundColor: "#3B6FD4",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
})
