import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  TextInput,
  View,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { ActionButton } from "../components/ActionButton"
import { FALLBACK_TARGET_AREAS } from "../constants/targetAreas"
import {
  getAllowedBodyParts,
  getExerciseById,
  getExerciseImageById,
  searchExercisesByBodyPart,
} from "../services/workoutApi"
import {
  addWorkoutForToday,
  isSavedWorkoutsDirty,
  markSavedWorkoutsClean,
  readSavedWorkouts,
  type SavedWorkoutsByDate,
} from "../storage/savedWorkouts"
import { readDarkMode, writeDarkMode } from "../storage/theme"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { todayKey } from "../utils/date"
import { getErrorMessage, toTitleCase } from "../utils/formatting"
import { makeStyles, VARIANT_STYLES, type DifficultyVariant } from "./stylesheets/TrainingScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "Training">

export function TrainingScreen({ navigation }: Props) {
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
  const [savedMap, setSavedMap] = useState<SavedWorkoutsByDate>({})
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)
  const [setCount, setSetCount] = useState<number>(1)
  // One {weight, reps} form per set, held as strings for controlled inputs.
  const [setForms, setSetForms] = useState<{ weight: string; reps: string }[]>([
    { weight: "", reps: "" },
  ])

  const styles = useMemo(() => makeStyles(isDark), [isDark])

  // Today's bucket drives the dedup/disable logic; the total across all days
  // drives the "View Saved Workouts" count.
  const todaysWorkouts = savedMap[todayKey()] ?? []
  const savedCount = useMemo(
    () => Object.values(savedMap).reduce((total, list) => total + list.length, 0),
    [savedMap],
  )

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      try {
        setIsDark(await readDarkMode())
      } catch {
        // Keep default (light) when the preference can't be read.
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

  // Re-sync saved workouts on focus only when a mutation happened elsewhere
  // (e.g. sets/reps edited on the Saved Workouts screen). Skips the storage
  // read entirely when nothing changed.
  useFocusEffect(
    useCallback(() => {
      if (!isSavedWorkoutsDirty()) return
      let active = true
      readSavedWorkouts()
        .then((map) => {
          if (active) {
            setSavedMap(map)
            markSavedWorkoutsClean()
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
      for (let i = 10; i > 0; i--) {
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

  function openSaveModal(): void {
    if (!currentWorkout) {
      Alert.alert("No workout selected", "Find a workout before saving.")
      return
    }

    if (todaysWorkouts.some((w) => w.id === currentWorkout.id)) {
      Alert.alert(
        "Already saved",
        "This workout is already saved for today.",
      )
      return
    }

    setSetCount(1)
    setSetForms([{ weight: "", reps: "" }])
    setSaveModalVisible(true)
  }

  // Resize the per-set forms to match the chosen count, preserving any values
  // already entered for sets that survive the resize.
  function onChangeSetCount(count: number): void {
    setSetCount(count)
    setSetForms((prev) => {
      if (count <= prev.length) return prev.slice(0, count)
      const grown = [...prev]
      while (grown.length < count) grown.push({ weight: "", reps: "" })
      return grown
    })
  }

  function onChangeSetField(
    index: number,
    field: "weight" | "reps",
    text: string,
  ): void {
    const digits = text.replace(/[^0-9]/g, "")
    setSetForms((prev) =>
      prev.map((form, i) => (i === index ? { ...form, [field]: digits } : form)),
    )
  }

  function onToggleDark(value: boolean): void {
    setIsDark(value)
    writeDarkMode(value).catch(() => {
      // Non-fatal: the toggle still applies for this session.
    })
  }

  async function onConfirmSave(): Promise<void> {
    if (!currentWorkout) return

    const setDetails = setForms.map((form) => ({
      weight: form.weight === "" ? undefined : Number(form.weight),
      reps: form.reps === "" ? undefined : Number(form.reps),
    }))
    const toSave: Workout = { ...currentWorkout, setDetails }

    setSaveModalVisible(false)

    try {
      const next = await addWorkoutForToday(toSave)
      setSavedMap(next)
      // This screen's state already reflects the write — stay clean so we
      // don't re-read storage on the next focus.
      markSavedWorkoutsClean()
      Alert.alert("Saved", "Workout added to today's saved list.")
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
                  onValueChange={onToggleDark}
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
              onPress={openSaveModal}
              disabled={
                isSearching ||
                !currentWorkout ||
                todaysWorkouts.some((w) => w.id === currentWorkout.id)
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

          <ActionButton
            label={
              savedCount
                ? `View Saved Workouts (${savedCount})`
                : "View Saved Workouts"
            }
            onPress={() => navigation.navigate("SavedWorkouts", { isDark })}
          />
        </View>
      </ScrollView>

      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Workout</Text>
            {currentWorkout ? (
              <Text style={styles.detailLabel}>{currentWorkout.name}</Text>
            ) : null}
            <Text style={styles.fieldLabel}>
              How many sets? (weight and reps are optional — you can edit them
              later)
            </Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={setCount}
                onValueChange={(value) => onChangeSetCount(Number(value))}
                dropdownIconColor={isDark ? "#8B949E" : "#DDE6F6"}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Picker.Item key={n} label={String(n)} value={n} />
                ))}
              </Picker>
            </View>
            <ScrollView style={styles.modalBody}>
              {setForms.map((form, index) => (
                <View key={index} style={styles.setRow}>
                  <Text style={styles.setRowLabel}>Set {index + 1}</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Weight (lbs)</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={form.weight}
                        onChangeText={(text) =>
                          onChangeSetField(index, "weight", text)
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                        maxLength={4}
                        accessibilityLabel={`Weight for set ${index + 1}`}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={form.reps}
                        onChangeText={(text) =>
                          onChangeSetField(index, "reps", text)
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={isDark ? "#6E7681" : "#A0AEC0"}
                        maxLength={3}
                        accessibilityLabel={`Reps for set ${index + 1}`}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <ActionButton label="Save" variant="accent" onPress={onConfirmSave} />
              <ActionButton
                label="Cancel"
                variant="secondary"
                onPress={() => setSaveModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

