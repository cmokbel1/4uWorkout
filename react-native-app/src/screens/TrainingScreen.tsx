import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Alert, Animated, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"

import { AppMenu } from "../components/AppMenu"
import { CollapsingTopBar, useCollapsingTopBar } from "../components/CollapsingTopBar"
import { FilterCard } from "../components/FilterCard"
import { SaveWorkoutModal } from "../components/SaveWorkoutModal"
import { SimilarWorkoutsList } from "../components/SimilarWorkoutsList"
import { ThemedButton } from "../components/ThemedButton"
import { WorkoutPanel } from "../components/WorkoutPanel"
import { useSavedWorkouts } from "../hooks/useSavedWorkouts"
import { useTabBarTheme } from "../hooks/useTabBarTheme"
import { useWorkoutViewer } from "../hooks/useWorkoutViewer"
import {
  getAllowedBodyParts,
  getFilterOptions,
  searchExercisesByBodyPart,
} from "../services/workoutApi"
import { notesForExercise } from "../storage/savedWorkouts"
import { readDarkMode, writeDarkMode } from "../storage/theme"
import { trainingSession } from "../state/trainingSession"
import { getPalette } from "../theme"
import type { ExerciseFilters, FilterOptionsByBodyPart } from "../types/filters"
import type { Workout, WorkoutSet } from "../types/workout"
import { todayKey } from "../utils/date"
import { hasActiveFilters, keepFiltersOffered } from "../utils/filters"
import { getErrorMessage } from "../utils/formatting"
import { shuffled } from "../utils/random"
import { makeStyles } from "./stylesheets/TrainingScreen.styles"

// Upper bound, not a requirement: a filtered search can match fewer, and the
// list shows however many there are (possibly none).
const MAX_SIMILAR_WORKOUTS = 10

// Space between the expanded top bar and the first card.
const CONTENT_TOP_GAP = 16

// The Randomize tab: generates workouts from the user's filters.
export function TrainingScreen() {
  // Collapses as the content scrolls; see CollapsingTopBar.
  const topBar = useCollapsingTopBar()
  // The workout on show, hydrated from the session so it survives a remount.
  const viewer = useWorkoutViewer(trainingSession.currentWorkout, topBar.collapsedTopBarHeight)
  const { currentWorkout } = viewer
  const { savedMap, saveForToday } = useSavedWorkouts()

  const [isDark, setIsDark] = useState<boolean>(false)
  // The cog's menu: the dark mode switch.
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
  // The last search matched nothing: shown inline instead of in an alert.
  const [noMatches, setNoMatches] = useState<boolean>(false)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)

  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  useTabBarTheme(palette)

  // A workout is only "loaded" once every request has finished (isSearching)
  // AND its image has drawn (see useWorkoutViewer). Until then the card shows
  // a spinner.
  const { isImageLoading } = viewer
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
  // Shown as "Last time" on the workout panel.
  const previousNotes = currentWorkout ? notesForExercise(savedMap, currentWorkout.id) : []

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
        viewer.setCurrentWorkout(null)
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
      await viewer.loadListWorkout(selected)
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

  async function onSelectSimilarWorkout(item: Workout): Promise<void> {
    setSearchResults(
      shuffled(allResults).filter((w) => w.id !== item.id).slice(0, MAX_SIMILAR_WORKOUTS),
    )
    setIsSearching(true)
    try {
      await viewer.loadFullWorkout(item)
    } finally {
      setIsSearching(false)
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
    setSaveModalVisible(false)
    await saveForToday(currentWorkout, setDetails)
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
          ref={viewer.scrollViewRef}
          contentContainerStyle={[
            styles.content,
            { paddingTop: topBar.topBarHeight + CONTENT_TOP_GAP },
          ]}
          scrollIndicatorInsets={{ top: topBar.collapsedTopBarHeight }}
          scrollEventThrottle={16}
          onScroll={topBar.onScroll}
          onLayout={viewer.onScrollViewLayout}
          onContentSizeChange={viewer.onContentSizeChange}
        >
          <View style={styles.controlSection}>
            <Text style={styles.sectionLabel} accessibilityRole="header">
              FIND A WORKOUT FOR ME
            </Text>
            <FilterCard
              palette={palette}
              bodyParts={bodyPartOptions}
              selectedBodyPart={selectedBodyPart}
              onChangeBodyPart={onChangeBodyPart}
              filterOptions={filterOptions[selectedBodyPart]}
              filters={filters}
              onChangeFilters={setFilters}
            />
          </View>

          {currentWorkout ? (
            <View style={styles.resultCard} onLayout={viewer.onResultCardLayout}>
              <Animated.View style={{ opacity: viewer.resultOpacity }}>
                <WorkoutPanel
                  workout={currentWorkout}
                  palette={palette}
                  onImageLoad={() => viewer.onResultImageLoad(currentWorkout.id)}
                  previousNotes={previousNotes}
                />
              </Animated.View>
              {isLoading && (
                <View style={styles.resultOverlay}>
                  <ActivityIndicator size="large" color={palette.accent} />
                </View>
              )}
            </View>
          ) : isSearching ? (
            <View style={styles.resultCard} onLayout={viewer.onResultCardLayout}>
              <ActivityIndicator size="large" color={palette.accent} />
            </View>
          ) : noMatches ? (
            <View style={styles.emptyCard} onLayout={viewer.onResultCardLayout}>
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
            <View style={styles.emptyCard} onLayout={viewer.onResultCardLayout}>
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
              style={{ opacity: viewer.resultOpacity }}
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

        <CollapsingTopBar palette={palette} bar={topBar.bar} onOpenMenu={() => setMenuVisible(true)} />
      </View>

      <View style={styles.bottomBar}>
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
        // The tab bar does the navigating.
        links={[]}
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
