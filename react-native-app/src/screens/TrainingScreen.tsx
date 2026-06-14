import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
  Switch,
  Text,
  View,
} from "react-native"
import { Picker } from "@react-native-picker/picker"

import { ActionButton } from "../components/ActionButton"
import { FALLBACK_TARGET_AREAS } from "../constants/targetAreas"
import {
  getAllowedBodyParts,
  getExerciseById,
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
import { makeStyles, VARIANT_STYLES, type DifficultyVariant } from "./stylesheets/TrainingScreen.styles"

export function TrainingScreen() {
  const scrollViewRef = useRef<ScrollView>(null)
  const workoutPanelRef = useRef<View>(null)

  const [isDark, setIsDark] = useState<boolean>(false)
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false)
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isFindCoolingDown, setIsFindCoolingDown] = useState<boolean>(false)
  const findCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const styles = useMemo(() => makeStyles(isDark), [isDark])

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
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    return () => {
      if (findCooldownRef.current) clearTimeout(findCooldownRef.current)
    }
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
      setSearchResults(shuffled.filter((w) => w.id !== selected.id).slice(0, 10))
      await getImageAndUpdateWorkoutState(selected)
    } catch (error: unknown) {
      Alert.alert("Search failed", getErrorMessage(error))
    } finally {
      setIsSearching(false)
      setIsFindCoolingDown(true)
      findCooldownRef.current = setTimeout(() => setIsFindCoolingDown(false), 3000)
    }
  }

  function scrollToWorkoutPanel(): void {
    workoutPanelRef.current?.measureLayout(
      scrollViewRef.current as any,
      (_, y) => scrollViewRef.current?.scrollTo({ y, animated: true }),
      () => {},
    )
  }

  async function onSelectSimilarWorkout(item: Workout): Promise<void> {
    const pool = [...allResults]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setSearchResults(pool.filter((w) => w.id !== item.id).slice(0, 10))
    setIsSearching(true)
    scrollToWorkoutPanel()
    try {
      const workout = await getExerciseById(item.id)
      setCurrentWorkout(workout)
    } catch {
      try {
        const imageUrl = await getExerciseImageById(item.id)
        setCurrentWorkout({ ...item, gifUrl: imageUrl })
      } catch (imgError) {
        console.error("Failed to fetch exercise:", item.id, imgError)
      }
    } finally {
      setIsSearching(false)
    }
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

  function onSelectSavedWorkout(item: Workout): void {
    if (currentWorkout?.id === item.id) return
    setCurrentWorkout(item)
    scrollToWorkoutPanel()
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

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.bootstrapLoader}>
          <ActivityIndicator size="large" color="#3B6FD4" style={styles.bootstrapSpinner} />
          <Text style={styles.bootstrapLoaderText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>4UWorkout Trainer</Text>
          <Pressable
            onPress={() => setSettingsVisible(true)}
            style={styles.cogButton}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Text style={styles.cogIcon}>⚙</Text>
          </Pressable>
        </View>

        <Modal
          visible={settingsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Settings</Text>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsRowLabel}>Dark Mode</Text>
                <Switch
                  value={isDark}
                  onValueChange={setIsDark}
                  trackColor={{ false: "#C9D3E0", true: "#3B6FD4" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Pressable
                style={styles.modalClose}
                onPress={() => setSettingsVisible(false)}
                accessibilityLabel="Close settings"
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select a Body Part</Text>
          <Text style={styles.fieldLabel}>Find a workout for:</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedBodyPart}
              onValueChange={(value) => setSelectedBodyPart(String(value))}
              dropdownIconColor={isDark ? "#8B949E" : "#DDE6F6"}
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
              disabled={isSearching || isFindCoolingDown}
            />
            <ActionButton
              label="Save Workout"
              variant="accent"
              onPress={onSaveWorkout}
              disabled={
                isSearching ||
                !currentWorkout ||
                savedWorkouts.some((w) => w.id === currentWorkout.id)
              }
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
                <Text
                  style={[
                    styles.difficulty,
                    VARIANT_STYLES[currentWorkout.difficulty as DifficultyVariant],
                  ]}
                >
                  {currentWorkout.difficulty}
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
                      <Text style={styles.modalText}>
                        {currentWorkout.instructions}
                      </Text>
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
                  <ActivityIndicator
                    size="large"
                    color={isDark ? "#8B949E" : "#4A5568"}
                    style={styles.searchSpinner}
                  />
                </View>
              )}
            </View>
          ) : isSearching ? (
            <ActivityIndicator
              size="large"
              color={isDark ? "#8B949E" : "#4A5568"}
              style={[styles.loadingIndicator, styles.searchSpinner]}
            />
          ) : (
            <Text style={styles.helperText}>
              Choose a body part and tap Find.
            </Text>
          )}

          {currentWorkout && !isSearching && (
            <>
              <Text style={styles.savedTitle}>Similar Workouts</Text>
              <Text style={styles.fieldLabel}>
                Select a workout for more information
              </Text>
              {searchResults.length ? (
                searchResults.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectSimilarWorkout(item)}
                    style={({ pressed }) => [styles.resultItem, pressed && styles.pressedItem]}
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
                <Text style={styles.helperText}>
                  Similar workouts will appear when a search is executed and
                  similar exercises are found.
                </Text>
              )}
            </>
          )}

          <Text style={styles.savedTitle}>Saved Workouts</Text>
          {savedWorkouts.length ? (
            <Text style={styles.helperText}>
              Click a saved workout to view it again.
            </Text>
          ) : null}
          {savedWorkouts.length ? (
            savedWorkouts.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectSavedWorkout(item)}
                style={({ pressed }) => [styles.savedWorkoutItem, pressed && styles.pressedItem]}
                accessibilityLabel={`Load ${item.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.savedItemName}>{item.name}</Text>
                <Text style={styles.savedItemTarget}>{item.target}</Text>
              </Pressable>
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

