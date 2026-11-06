import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { AppMenu } from "../components/AppMenu"
import { CollapsingTopBar, useCollapsingTopBar } from "../components/CollapsingTopBar"
import { FilterCard } from "../components/FilterCard"
import { NavCard } from "../components/NavCard"
import { SaveWorkoutModal } from "../components/SaveWorkoutModal"
import { SimilarWorkoutsList } from "../components/SimilarWorkoutsList"
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
import type { ExerciseFilters, FilterOptionsByBodyPart } from "../types/filters"
import type { Workout, WorkoutSet } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { todayKey } from "../utils/date"
import { hasActiveFilters, keepFiltersOffered } from "../utils/filters"
import { getErrorMessage } from "../utils/formatting"
import { shuffled } from "../utils/random"
import { makeStyles } from "./stylesheets/TrainingScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "Training">

// Upper bound, not a requirement: a filtered search can match fewer, and the
// list shows however many there are (possibly none).
const MAX_SIMILAR_WORKOUTS = 10

// Gap left above the result card when it's scrolled to just below the top bar.
const RESULT_SCROLL_MARGIN = 12

// Space between the expanded top bar and the first card.
const CONTENT_TOP_GAP = 16

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

  // Collapses as the content scrolls; see CollapsingTopBar.
  const topBar = useCollapsingTopBar()
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

  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])

  // A workout is only "loaded" once every request has finished (isSearching)
  // AND its GIF has been decoded and drawn — the base64 image arrives with the
  // request but takes a moment to render. Until then the card shows a spinner;
  // onResultImageLoad then fades it in and scrolls to it.
  const isImageLoading =
    Boolean(currentWorkout?.gifUrl) && loadedImageId !== currentWorkout?.id
  const isLoading = isSearching || isImageLoading
  // Nothing is chosen by default: the filters and Find stay locked until the
  // user picks a body part (target and equipment options depend on it).
  const hasBodyPart = Boolean(selectedBodyPart)
  const filtersActive = hasActiveFilters(filters)

  // Today's bucket drives the dedup/disable logic.
  const todaysWorkouts = savedMap[todayKey()] ?? []
  const isCurrentSavedToday = Boolean(
    currentWorkout && todaysWorkouts.some((w) => w.id === currentWorkout.id),
  )

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
          // the restored filters. Otherwise none is chosen: the user picks one.
          setSelectedBodyPart(
            allowedBodyParts.includes(trainingSession.selectedBodyPart)
              ? trainingSession.selectedBodyPart
              : "",
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
    // Find is disabled until a body part is chosen.
    if (!selectedBodyPart) return

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

  function onChangeBodyPart(bodyPart: string): void {
    setSelectedBodyPart(bodyPart)
    setFilters((prev) => keepFiltersOffered(prev, filterOptions[bodyPart]))
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
      resultCardYRef.current - topBar.collapsedTopBarHeight - RESULT_SCROLL_MARGIN,
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

  function onToggleDark(value: boolean): void {
    setIsDark(value)
    writeDarkMode(value).catch(() => {
      // Non-fatal: the toggle still applies for this session.
    })
  }

  async function onConfirmSave(setDetails: WorkoutSet[]): Promise<void> {
    if (!currentWorkout) return

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
          contentContainerStyle={[
            styles.content,
            { paddingTop: topBar.topBarHeight + CONTENT_TOP_GAP },
          ]}
          scrollIndicatorInsets={{ top: topBar.collapsedTopBarHeight }}
          scrollEventThrottle={16}
          onScroll={topBar.onScroll}
          onLayout={(event) => {
            viewportHeightRef.current = event.nativeEvent.layout.height
          }}
          onContentSizeChange={(_width, height) => {
            contentHeightRef.current = height
          }}
        >
          <FilterCard
            palette={palette}
            bodyParts={bodyPartOptions}
            selectedBodyPart={selectedBodyPart}
            onChangeBodyPart={onChangeBodyPart}
            filterOptions={filterOptions[selectedBodyPart]}
            filters={filters}
            onChangeFilters={setFilters}
          />

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
                {filtersActive
                  ? "Try a wider difficulty range, or set Target or Equipment back to Any."
                  : "Try a different body part."}
              </Text>
              {filtersActive ? (
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
              <View style={styles.emptySteps}>
                {["Select a body part", "Tap Find for a random pick"].map((step, index) => (
                  <View key={step} style={styles.emptyStep}>
                    <View style={styles.emptyStepIndex}>
                      {index === 0 && hasBodyPart ? (
                        <Feather name="check" size={13} color={palette.accent} />
                      ) : (
                        <Text style={styles.emptyStepIndexText}>{index + 1}</Text>
                      )}
                    </View>
                    <Text style={styles.emptyStepText}>{step}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.emptyText}>
                Difficulty, target and equipment are optional.
              </Text>
            </View>
          )}

          {currentWorkout && !isSearching && (
            // Laid out as soon as the requests finish, so the page is at full
            // length when the image draws and the scroll runs. Hidden and not
            // tappable until then, it fades in with the card.
            <Animated.View
              style={{ opacity: resultOpacity }}
              pointerEvents={isImageLoading ? "none" : "auto"}
            >
              <SimilarWorkoutsList
                palette={palette}
                workouts={searchResults}
                onSelect={onSelectSimilarWorkout}
                // The advice is about filters, so it only shows when one is
                // active (unfiltered, every body part fills the list anyway).
                showFilterTip={filtersActive && searchResults.length < MAX_SIMILAR_WORKOUTS}
              />
            </Animated.View>
          )}
        </Animated.ScrollView>

        <CollapsingTopBar palette={palette} bar={topBar.bar} onOpenMenu={() => setMenuVisible(true)}>
          <NavCard
            palette={palette}
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
        </CollapsingTopBar>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ThemedButton
          palette={palette}
          label={isLoading ? "Loading…" : "Find"}
          icon="shuffle"
          variant="action"
          onPress={onSearchWorkout}
          loading={isLoading}
          disabled={isFindCoolingDown || !hasBodyPart}
        />
        <ThemedButton
          palette={palette}
          label={isCurrentSavedToday ? "Saved" : "Save workout"}
          icon={isCurrentSavedToday ? "check" : "bookmark"}
          variant="actionOutline"
          // Disabled with no workout, or one already saved today.
          onPress={() => setSaveModalVisible(true)}
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

      <SaveWorkoutModal
        palette={palette}
        visible={saveModalVisible}
        workoutName={currentWorkout?.name}
        onCancel={() => setSaveModalVisible(false)}
        onConfirm={onConfirmSave}
      />
    </SafeAreaView>
  )
}
