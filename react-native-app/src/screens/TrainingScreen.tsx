import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { AppMenu } from "../components/AppMenu"
import { NavCard } from "../components/NavCard"
import { RangeSlider, type LevelRange } from "../components/RangeSlider"
import { SelectField, type SelectOption } from "../components/SelectField"
import { ThemedButton } from "../components/ThemedButton"
import { WorkoutPanel } from "../components/WorkoutPanel"
import {
  getAllowedBodyParts,
  getExerciseById,
  getExerciseImageById,
  getFilterOptions,
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
import { trainingSession } from "../state/trainingSession"
import { getPalette } from "../theme"
import {
  DIFFICULTIES,
  type EquipmentType,
  type ExerciseFilters,
  type FilterOption,
  type FilterOptionsByBodyPart,
} from "../types/filters"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { todayKey } from "../utils/date"
import { getErrorMessage, toTitleCase } from "../utils/formatting"
import { makeStyles } from "./stylesheets/TrainingScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "Training">

// Upper bound, not a requirement: a filtered search can match fewer, and the
// list shows however many there are (possibly none).
const MAX_SIMILAR_WORKOUTS = 10

// Gap left above the result card when it's scrolled to just below the top bar.
const RESULT_SCROLL_MARGIN = 12

// Collapsing top bar. Its real size is measured; this is only the first-frame
// guess (so the content doesn't start underneath it).
const TOP_BAR_HEIGHT_ESTIMATE = 170
// Must match styles.topBar's gap (the space above the nav cards).
const TOP_BAR_GAP = 16
// Space between the expanded top bar and the first card.
const CONTENT_TOP_GAP = 16
// How small "Trainer" gets when the bar is collapsed.
const COLLAPSED_TITLE_SCALE = 0.72

const DIFFICULTY_LABELS = DIFFICULTIES.map((level) => toTitleCase(level))
const FULL_DIFFICULTY_RANGE: LevelRange = { min: 0, max: DIFFICULTIES.length - 1 }

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  free_weight: "Free weights",
  bodyweight: "Bodyweight",
  cable: "Cable",
  machine: "Machine",
  accessory: "Accessory",
  band: "Band",
}

// "" stands for "no filter" in the target and equipment fields.
const ANY_OPTION: SelectOption = { value: "", label: "Any" }

const SET_COUNT_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

// The two inputs on each set row of the save dialog.
const SET_FIELDS = [
  { field: "weight", label: "WEIGHT (LBS)", name: "Weight", maxLength: 4 },
  { field: "reps", label: "REPS", name: "Reps", maxLength: 3 },
] as const

// Fisher-Yates shuffle into a new array.
function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function TrainingScreen({ navigation }: Props) {
  const scrollViewRef = useRef<ScrollView>(null)
  // Where the result card sits in the scroll content (from its onLayout).
  const resultCardYRef = useRef<number>(0)
  // Set when a workout is being loaded; cleared once it has been scrolled to.
  const scrollToResultPendingRef = useRef<boolean>(false)
  // Used to keep scroll targets within the content: scrollTo doesn't stop at
  // the end of the content on iOS.
  const contentHeightRef = useRef<number>(0)
  const viewportHeightRef = useRef<number>(0)
  // Each newly shown workout starts hidden and fades in once its image has
  // drawn (onResultImageLoad). A workout restored from the session does too.
  const resultOpacity = useRef(
    new Animated.Value(trainingSession.currentWorkout ? 0 : 1),
  ).current

  // Collapsing top bar, driven by the scroll position on the native thread. As
  // the content scrolls up by `collapseDistance`, the nav cards slide up behind
  // the title row and fade, and "Trainer" shrinks toward its bottom-left. The
  // app name stays visible at full size: it slides down by the space the
  // shrinking title gives up, so it stays right above it. The whole bar
  // (background and divider) slides up by `collapseDistance` while the title
  // row is shifted back down by `navCollapse`, so the row rises only by that
  // freed space — leaving a slim bar that still reads "4UWORKOUT / Trainer".
  // The bar floats over the content, so its size never changes the scroll
  // view's layout.
  const scrollY = useRef(new Animated.Value(0)).current
  const [topBarHeight, setTopBarHeight] = useState<number>(TOP_BAR_HEIGHT_ESTIMATE)
  const [navRowHeight, setNavRowHeight] = useState<number>(0)
  const [titleHeight, setTitleHeight] = useState<number>(0)
  const navCollapse = navRowHeight + TOP_BAR_GAP
  // Height "Trainer" gives up when it shrinks.
  const titleShrink = titleHeight * (1 - COLLAPSED_TITLE_SCALE)
  // Clamped to 1 so the interpolations below stay valid before measuring.
  const collapseDistance = Math.max(navCollapse + titleShrink, 1)
  const collapsedTopBarHeight = topBarHeight - collapseDistance
  const { barShift, headerShift, brandShift, navOpacity, titleScale } = useMemo(() => {
    const range = (output: number[], end = collapseDistance) =>
      scrollY.interpolate({ inputRange: [0, end], outputRange: output, extrapolate: "clamp" })
    return {
      barShift: range([0, -collapseDistance]),
      headerShift: range([0, navCollapse]),
      brandShift: range([0, titleShrink]),
      navOpacity: range([1, 0], collapseDistance * 0.6),
      titleScale: range([1, COLLAPSED_TITLE_SCALE]),
    }
  }, [scrollY, collapseDistance, navCollapse, titleShrink])
  const insets = useSafeAreaInsets()

  const [isDark, setIsDark] = useState<boolean>(false)
  // The cog's menu: Today's workouts, Calendar and the dark mode switch.
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isFindCoolingDown, setIsFindCoolingDown] = useState<boolean>(false)
  const findCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [bodyPartOptions, setBodyPartOptions] = useState<string[]>([])
  // Hydrated from the session too: the sync effect below writes this back on
  // mount, before bootstrap reads it, so starting from "" would erase it.
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>(
    () => trainingSession.selectedBodyPart,
  )
  // Filter choices for every body part, fetched once per session. Empty when
  // the request fails, which just leaves searches unfiltered.
  const [filterOptions, setFilterOptions] = useState<FilterOptionsByBodyPart>(
    () => trainingSession.filterOptions ?? {},
  )
  // The user's filter choices, sent with every search.
  const [filters, setFilters] = useState<ExerciseFilters>(
    () => trainingSession.filters,
  )
  // Hydrate the randomized search state from the in-memory session snapshot so
  // it survives a remount when navigating back to this screen.
  const [allResults, setAllResults] = useState<Workout[]>(
    () => trainingSession.allResults,
  )
  const [searchResults, setSearchResults] = useState<Workout[]>(
    () => trainingSession.searchResults,
  )
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(
    () => trainingSession.currentWorkout,
  )
  // Id of the workout whose image has finished drawing (see isLoading below).
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null)
  // The last search matched nothing: shown inline instead of in an alert.
  const [noMatches, setNoMatches] = useState<boolean>(false)
  const [savedMap, setSavedMap] = useState<SavedWorkoutsByDate>({})
  // Whether this mount has loaded savedMap yet. The dirty flag is module-level,
  // so it can say "clean" from an earlier mount while this one still has {}.
  const savedMapLoadedRef = useRef<boolean>(false)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)
  const [setCount, setSetCount] = useState<number>(1)
  // One {weight, reps} form per set, held as strings for controlled inputs.
  const [setForms, setSetForms] = useState<{ weight: string; reps: string }[]>([
    { weight: "", reps: "" },
  ])

  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])

  // A workout is only "loaded" once every request has finished (isSearching)
  // AND its GIF has been decoded and drawn — the base64 image arrives with the
  // request but takes a moment to render. Until then the card shows a spinner;
  // onResultImageLoad then fades it in and scrolls to it.
  const isImageLoading =
    Boolean(currentWorkout?.gifUrl) && loadedImageId !== currentWorkout?.id
  const isLoading = isSearching || isImageLoading
  const hasActiveFilters = Boolean(
    filters.difficulties?.length || filters.target || filters.equipmentTypes?.length,
  )

  // Today's bucket drives the dedup/disable logic.
  const todaysWorkouts = savedMap[todayKey()] ?? []
  const isCurrentSavedToday = Boolean(
    currentWorkout && todaysWorkouts.some((w) => w.id === currentWorkout.id),
  )

  // The slider shows the selected difficulties as a range; no filter is the
  // full range.
  const difficultyRange: LevelRange = filters.difficulties?.length
    ? {
        min: DIFFICULTIES.indexOf(filters.difficulties[0]),
        max: DIFFICULTIES.indexOf(filters.difficulties[filters.difficulties.length - 1]),
      }
    : FULL_DIFFICULTY_RANGE
  const difficultyRangeLabel =
    difficultyRange.min === difficultyRange.max
      ? DIFFICULTY_LABELS[difficultyRange.min]
      : `${DIFFICULTY_LABELS[difficultyRange.min]} – ${DIFFICULTY_LABELS[difficultyRange.max]}`

  const bodyPartSelectOptions: SelectOption[] = bodyPartOptions.map((bodyPart) => ({
    value: bodyPart,
    label: toTitleCase(bodyPart),
  }))
  const currentFilterOptions = filterOptions[selectedBodyPart]
  // How many exercises an option matches within the selected difficulty range:
  // exercises outside the range don't count. Without a difficulty filter (or
  // from a server that doesn't send byDifficulty) it's the plain total.
  const countInDifficultyRange = (option: FilterOption): number =>
    filters.difficulties?.length && option.byDifficulty
      ? filters.difficulties.reduce((sum, level) => sum + (option.byDifficulty?.[level] ?? 0), 0)
      : option.count
  // An option with nothing in range is shown with its 0 but can't be picked.
  const toSelectOption = (option: FilterOption, label: string): SelectOption => {
    const count = countInDifficultyRange(option)
    return { value: option.value, label, detail: String(count), disabled: count === 0 }
  }
  const targetSelectOptions: SelectOption[] = [
    ANY_OPTION,
    ...(currentFilterOptions?.targets ?? []).map((option) =>
      toSelectOption(option, toTitleCase(option.value)),
    ),
  ]
  const equipmentSelectOptions: SelectOption[] = [
    ANY_OPTION,
    ...(currentFilterOptions?.equipmentTypes ?? []).map((option) =>
      toSelectOption(
        option,
        EQUIPMENT_LABELS[option.value as EquipmentType] ?? toTitleCase(option.value),
      ),
    ),
  ]

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      try {
        setIsDark(await readDarkMode())
      } catch {
        // Keep default (light) when the preference can't be read.
      }

      // Not awaited: the screen doesn't need filter options to render. A
      // failure leaves session.filterOptions null, so the next mount retries.
      if (!trainingSession.filterOptions) {
        getFilterOptions()
          .then((options) => {
            trainingSession.filterOptions = options
            setFilterOptions(options)
          })
          .catch(() => {})
      }

      try {
        const allowedBodyParts = await getAllowedBodyParts()
        if (allowedBodyParts.length) {
          setBodyPartOptions(allowedBodyParts)
          // Restore the body part from before a remount, so it still matches
          // the restored filters.
          setSelectedBodyPart(
            allowedBodyParts.includes(trainingSession.selectedBodyPart)
              ? trainingSession.selectedBodyPart
              : allowedBodyParts[0],
          )
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

  // Keep the session snapshot in sync so a later remount can restore it.
  useEffect(() => {
    trainingSession.allResults = allResults
    trainingSession.searchResults = searchResults
    trainingSession.currentWorkout = currentWorkout
    trainingSession.filters = filters
    trainingSession.selectedBodyPart = selectedBodyPart
  }, [allResults, searchResults, currentWorkout, filters, selectedBodyPart])

  // Load saved workouts on this mount's first focus, then re-sync only when a
  // mutation happened elsewhere (e.g. sets/reps edited on the Saved Workouts
  // screen). Without the first load, a remount (navigating back can remount
  // this screen) kept an empty savedMap, so Save stayed enabled for a workout
  // already saved today.
  useFocusEffect(
    useCallback(() => {
      if (savedMapLoadedRef.current && !isSavedWorkoutsDirty()) return
      let active = true
      readSavedWorkouts()
        .then((map) => {
          if (active) {
            setSavedMap(map)
            savedMapLoadedRef.current = true
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

  // Dark mode can also be changed from the Calendar's menu, while this screen
  // stays mounted underneath — so re-read it whenever it comes back into focus.
  useFocusEffect(
    useCallback(() => {
      readDarkMode()
        .then(setIsDark)
        .catch(() => {
          // Keep the current theme if the preference can't be read.
        })
    }, []),
  )

  async function onSearchWorkout(): Promise<void> {
    if (!selectedBodyPart) {
      Alert.alert("Body part required", "Select a body part before searching.")
      return
    }

    setIsSearching(true)
    setNoMatches(false)
    try {
      const results = await searchExercisesByBodyPart(selectedBodyPart, filters)
      if (!results.length) {
        // Clear the old result: it no longer matches what was asked for.
        setCurrentWorkout(null)
        setAllResults([])
        setSearchResults([])
        setNoMatches(true)
        return
      }
      // The first shuffled result is shown; the rest (up to the maximum, or
      // fewer when filters narrow the search) become the similar list.
      const shuffledResults = shuffled(results)
      const [selected, ...others] = shuffledResults
      setAllResults(shuffledResults)
      setSearchResults(others.slice(0, MAX_SIMILAR_WORKOUTS))
      await getImageAndUpdateWorkoutState(selected)
    } catch (error: unknown) {
      Alert.alert("Search failed", getErrorMessage(error))
    } finally {
      setIsSearching(false)
      setIsFindCoolingDown(true)
      findCooldownRef.current = setTimeout(() => setIsFindCoolingDown(false), 3000)
    }
  }

  // Targets and equipment types differ per body part, so drop choices the new
  // body part doesn't have. Difficulty applies to every body part and is kept.
  function onChangeBodyPart(bodyPart: string): void {
    setSelectedBodyPart(bodyPart)
    const options = filterOptions[bodyPart]
    const isOffered = (list: FilterOption[] | undefined, value: string) =>
      Boolean(list?.some((option) => option.value === value))
    setFilters((prev) => {
      const equipmentTypes = prev.equipmentTypes?.filter((type) =>
        isOffered(options?.equipmentTypes, type),
      )
      return {
        difficulties: prev.difficulties,
        target:
          prev.target && isOffered(options?.targets, prev.target)
            ? prev.target
            : undefined,
        equipmentTypes: equipmentTypes?.length ? equipmentTypes : undefined,
      }
    })
  }

  // The full range means "any difficulty", so it clears the filter.
  function onChangeDifficultyRange(range: LevelRange): void {
    const isFullRange =
      range.min === FULL_DIFFICULTY_RANGE.min && range.max === FULL_DIFFICULTY_RANGE.max
    setFilters((prev) => ({
      ...prev,
      difficulties: isFullRange ? undefined : DIFFICULTIES.slice(range.min, range.max + 1),
    }))
  }

  function openTodaysWorkouts(): void {
    navigation.navigate("SavedWorkouts", { isDark })
  }

  function openCalendar(): void {
    navigation.navigate("SavedWorkouts", { isDark, initialView: "calendar" })
  }

  // Scroll position that puts the result card's top just below the top bar.
  // The card sits far enough down that the bar is fully collapsed by then, so
  // it's the collapsed bar's height that the card has to clear.
  function resultScrollTarget(): number {
    return Math.max(
      resultCardYRef.current - collapsedTopBarHeight - RESULT_SCROLL_MARGIN,
      0,
    )
  }

  // Scrolls the result card to just below the top bar, or as far as the content
  // allows when the page is too short.
  function scrollResultCardIntoPlace(): void {
    const maxY = Math.max(contentHeightRef.current - viewportHeightRef.current, 0)
    scrollViewRef.current?.scrollTo({ y: Math.min(resultScrollTarget(), maxY), animated: true })
  }

  // Shows a newly loaded workout, hidden until its image has drawn.
  function showWorkout(workout: Workout): void {
    // Same image as the one already on screen (e.g. a search picks the workout
    // already shown): React Native's Image only reloads when its source
    // changes, so no onImageLoad would come and the card would stay hidden.
    // Keep it visible and finish loading now. (`currentWorkout` is the one on
    // screen when loading began; Find and the similar list are disabled until
    // loading ends, so it can't have changed since.)
    if (workout.gifUrl && workout.gifUrl === currentWorkout?.gifUrl) {
      setCurrentWorkout(workout)
      onResultImageLoad(workout.id)
      return
    }
    if (workout.gifUrl) resultOpacity.setValue(0)
    setCurrentWorkout(workout)
  }

  // The one trigger for the end of loading: the workout's image has drawn (or
  // failed to). The requests finished before the image was rendered, and the
  // similar list was laid out with them, so the page is at full length: fade
  // the card in, then scroll to it.
  function onResultImageLoad(workoutId: string): void {
    setLoadedImageId(workoutId)
    Animated.timing(resultOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start()
    if (scrollToResultPendingRef.current) {
      scrollToResultPendingRef.current = false
      scrollResultCardIntoPlace()
    }
  }

  // The card is a direct child of the scroll content, so its layout y is its
  // position within the content.
  function onResultCardLayout(event: LayoutChangeEvent): void {
    resultCardYRef.current = event.nativeEvent.layout.y
  }

  // Marks that the workout being loaded should be scrolled to once shown. When
  // one is already showing (picking a similar workout) the page is long enough
  // to scroll now, which brings its loading spinner into view. On the first
  // Find it isn't, so it waits for a single smooth scroll at the end.
  function beginLoadingWorkout(): void {
    scrollToResultPendingRef.current = true
    if (currentWorkout) scrollResultCardIntoPlace()
  }

  async function onSelectSimilarWorkout(item: Workout): Promise<void> {
    setSearchResults(
      shuffled(allResults).filter((w) => w.id !== item.id).slice(0, MAX_SIMILAR_WORKOUTS),
    )
    setIsSearching(true)
    beginLoadingWorkout()
    try {
      const workout = await getExerciseById(item.id)
      showWorkout(workout)
    } catch {
      try {
        const imageUrl = await getExerciseImageById(item.id)
        showWorkout({ ...item, gifUrl: imageUrl })
      } catch (imgError) {
        console.error("Failed to fetch exercise:", item.id, imgError)
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Loads the image for the workout a search picked and shows it. Runs inside
  // onSearchWorkout, which sets and clears isSearching around it.
  async function getImageAndUpdateWorkoutState(workout: Workout): Promise<void> {
    beginLoadingWorkout()
    try {
      const imageUrl = await getExerciseImageById(workout.id)
      showWorkout({ ...workout, gifUrl: imageUrl })
    } catch (error) {
      console.error("Failed to fetch image for workout:", workout.id, error)
    }
  }

  // The Save button is disabled with no workout, or one already saved today.
  function openSaveModal(): void {
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
      // No alert: the Save button now reads "Saved".
    } catch {
      Alert.alert("Save failed", "Could not write to local storage.")
    }
  }

  if (isBootstrapping) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.bootstrapLoader}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.bootstrapLoaderText}>Loading…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.body}>
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingTop: topBarHeight + CONTENT_TOP_GAP }]}
          scrollIndicatorInsets={{ top: collapsedTopBarHeight }}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          onLayout={(event) => {
            viewportHeightRef.current = event.nativeEvent.layout.height
          }}
          onContentSizeChange={(_width, height) => {
            contentHeightRef.current = height
          }}
        >
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>SELECT A BODY PART</Text>
            <SelectField
              palette={palette}
              title="Body part"
              options={bodyPartSelectOptions}
              value={selectedBodyPart}
              onChange={onChangeBodyPart}
            />

            <View style={styles.difficultyHeader}>
              <Text style={styles.difficultyTitle}>
                Difficulty <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={styles.rangeLabel}>{difficultyRangeLabel}</Text>
            </View>
            <Text style={styles.helperText}>
              Drag the handles for a range, or tap a level for just that one.
            </Text>
            <RangeSlider
              palette={palette}
              levels={DIFFICULTY_LABELS}
              value={difficultyRange}
              onChange={onChangeDifficultyRange}
            />
            <View style={styles.filterHint}>
              <Feather name="info" size={14} color={palette.accent} style={styles.filterHintIcon} />
              <Text style={styles.filterHintText}>
                Target and Equipment counts update to match your difficulty range.
              </Text>
            </View>

            <View style={styles.selectRow}>
              <View style={styles.selectCell}>
                <SelectField
                  palette={palette}
                  size="compact"
                  title="Target"
                  options={targetSelectOptions}
                  value={filters.target ?? ""}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, target: value || undefined }))
                  }
                />
              </View>
              <View style={styles.selectCell}>
                <SelectField
                  palette={palette}
                  size="compact"
                  title="Equipment"
                  options={equipmentSelectOptions}
                  value={filters.equipmentTypes?.[0] ?? ""}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      equipmentTypes: value ? [value as EquipmentType] : undefined,
                    }))
                  }
                />
              </View>
            </View>
          </View>

          {currentWorkout ? (
            <View style={styles.resultCard} onLayout={onResultCardLayout}>
              <Animated.View style={{ opacity: resultOpacity }}>
                <WorkoutPanel
                  workout={currentWorkout}
                  palette={palette}
                  onImageLoad={() => onResultImageLoad(currentWorkout.id)}
                />
              </Animated.View>
              {isLoading && (
                <View style={styles.resultOverlay}>
                  <ActivityIndicator size="large" color={palette.accent} />
                </View>
              )}
            </View>
          ) : isSearching ? (
            <View style={styles.resultCard} onLayout={onResultCardLayout}>
              <ActivityIndicator size="large" color={palette.accent} />
            </View>
          ) : noMatches ? (
            <View style={styles.emptyCard} onLayout={onResultCardLayout}>
              <View style={styles.emptyIcon}>
                <Feather name="filter" size={20} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>No workouts match</Text>
              <Text style={styles.emptyText}>
                {hasActiveFilters
                  ? "Try a wider difficulty range, or set Target or Equipment back to Any."
                  : "Try a different body part."}
              </Text>
              {hasActiveFilters ? (
                <View style={styles.emptyAction}>
                  <ThemedButton
                    palette={palette}
                    label="Clear filters"
                    icon="x"
                    variant="secondary"
                    onPress={() => {
                      setFilters({})
                      setNoMatches(false)
                    }}
                  />
                </View>
              ) : null}
            </View>
          ) : (
            // Same slot as the result card, so its position is known before the
            // first search.
            <View style={styles.emptyCard} onLayout={onResultCardLayout}>
              <View style={styles.emptyIcon}>
                <Feather name="shuffle" size={20} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>Your workout appears here</Text>
              <Text style={styles.emptyText}>
                Choose a body part and tap Find for a random workout.
              </Text>
            </View>
          )}

          {currentWorkout && !isSearching && (
            // Laid out as soon as the requests finish, so the page is at full
            // length when the image draws and the scroll runs. Hidden and not
            // tappable until then, it fades in with the card.
            <Animated.View
              style={[styles.similarSection, { opacity: resultOpacity }]}
              pointerEvents={isImageLoading ? "none" : "auto"}
            >
              <View style={styles.similarHeader}>
                <Text style={styles.similarTitle}>Similar workouts</Text>
                <Text style={styles.helperText}>
                  {searchResults.length
                    ? "Tap one for more information."
                    : "No other workouts match these filters."}
                </Text>
              </View>
              {searchResults.length ? (
                <View style={styles.similarList}>
                  {searchResults.map((item, idx) => (
                    <Pressable
                      key={item.id}
                      onPress={() => onSelectSimilarWorkout(item)}
                      style={({ pressed }) => [styles.similarItem, pressed && styles.pressed]}
                      accessibilityLabel={`Select ${item.name}`}
                      accessibilityRole="button"
                    >
                      <View style={styles.similarIndex}>
                        <Text style={styles.similarIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.similarText}>
                        <Text style={styles.similarName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.similarSub}>Target: {item.target}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={palette.textMuted} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {/* The advice is about filters, so it only shows when one is
                  active (unfiltered, every body part fills the list anyway). */}
              {hasActiveFilters && searchResults.length < MAX_SIMILAR_WORKOUTS ? (
                <View style={styles.tip}>
                  <Feather name="info" size={16} color={palette.accent} />
                  <Text style={styles.tipText}>
                    If you're stuck and the similar workouts list is too short,
                    update your filters and try again, or change body part.
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          )}
        </Animated.ScrollView>

        <Animated.View
          style={[styles.topBar, styles.topBarOverlay, { transform: [{ translateY: barShift }] }]}
          onLayout={(event) => setTopBarHeight(event.nativeEvent.layout.height)}
        >
          <Animated.View
            style={[styles.header, styles.headerLayer, { transform: [{ translateY: headerShift }] }]}
          >
            <View>
              <Animated.Text
                style={[styles.brand, { transform: [{ translateY: brandShift }] }]}
              >
                4UWORKOUT
              </Animated.Text>
              <Animated.Text
                style={[styles.title, styles.titleOrigin, { transform: [{ scale: titleScale }] }]}
                onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)}
                accessibilityRole="header"
              >
                Trainer
              </Animated.Text>
            </View>
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityLabel="Open menu"
              accessibilityRole="button"
            >
              <Feather name="settings" size={20} color={palette.text} />
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[styles.navRow, { opacity: navOpacity }]}
            onLayout={(event) => setNavRowHeight(event.nativeEvent.layout.height)}
          >
            <NavCard
              palette={palette}
              highlighted
              icon="zap"
              title="Today's workouts"
              subtitle="Your plan"
              onPress={openTodaysWorkouts}
            />
            <NavCard
              palette={palette}
              icon="calendar"
              title="Calendar"
              subtitle="Schedule"
              onPress={openCalendar}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ThemedButton
          palette={palette}
          label={isLoading ? "Loading…" : "Find"}
          icon="shuffle"
          onPress={onSearchWorkout}
          loading={isLoading}
          disabled={isFindCoolingDown}
        />
        <ThemedButton
          palette={palette}
          label={isCurrentSavedToday ? "Saved" : "Save workout"}
          icon={isCurrentSavedToday ? "check" : "bookmark"}
          variant="secondary"
          onPress={openSaveModal}
          disabled={isLoading || !currentWorkout || isCurrentSavedToday}
        />
      </View>

      <AppMenu
        palette={palette}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        links={[
          { title: "Today's workouts", subtitle: "Your plan", icon: "zap", onPress: openTodaysWorkouts },
          { title: "Calendar", subtitle: "Schedule", icon: "calendar", onPress: openCalendar },
        ]}
        isDark={isDark}
        onToggleDark={onToggleDark}
      />

      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save workout</Text>
            {currentWorkout ? (
              <Text style={styles.modalSubtitle}>{currentWorkout.name}</Text>
            ) : null}
            <Text style={styles.helperText}>
              Weight and reps are optional — you can edit them later.
            </Text>
            <SelectField
              palette={palette}
              size="compact"
              title="Sets"
              options={SET_COUNT_OPTIONS}
              value={String(setCount)}
              onChange={(value) => onChangeSetCount(Number(value))}
            />
            <ScrollView style={styles.modalBody}>
              {setForms.map((form, index) => (
                <View key={index} style={styles.setRow}>
                  <Text style={styles.setRowLabel}>Set {index + 1}</Text>
                  <View style={styles.inputRow}>
                    {SET_FIELDS.map((input) => (
                      <View key={input.field} style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{input.label}</Text>
                        <TextInput
                          style={styles.numberInput}
                          value={form[input.field]}
                          onChangeText={(text) => onChangeSetField(index, input.field, text)}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={palette.textDisabled}
                          maxLength={input.maxLength}
                          accessibilityLabel={`${input.name} for set ${index + 1}`}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <ThemedButton
                palette={palette}
                label="Cancel"
                variant="secondary"
                onPress={() => setSaveModalVisible(false)}
              />
              <ThemedButton
                palette={palette}
                label="Save"
                icon="check"
                onPress={onConfirmSave}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
