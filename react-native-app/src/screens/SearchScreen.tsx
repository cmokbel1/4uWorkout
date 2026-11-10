import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Animated, Keyboard, Pressable, Text, TextInput, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { AppMenu } from "../components/AppMenu"
import { CollapsingTopBar, useCollapsingTopBar } from "../components/CollapsingTopBar"
import { NavCard } from "../components/NavCard"
import { SaveWorkoutModal } from "../components/SaveWorkoutModal"
import { SimilarWorkoutsList } from "../components/SimilarWorkoutsList"
import { SuggestionPills } from "../components/SuggestionPills"
import { ThemedButton } from "../components/ThemedButton"
import { WorkoutPanel } from "../components/WorkoutPanel"
import { useSavedWorkouts } from "../hooks/useSavedWorkouts"
import { useWorkoutViewer } from "../hooks/useWorkoutViewer"
import { ApiError, getSearchSuggestions, searchExercises } from "../services/workoutApi"
import { notesForExercise } from "../storage/savedWorkouts"
import { readDarkMode, writeDarkMode } from "../storage/theme"
import { getPalette } from "../theme"
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, SEARCH_SAMPLE_SIZE } from "../types/search"
import type { Workout, WorkoutSet } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { todayKey } from "../utils/date"
import {
  cleanSearchInput,
  hasSuggestion,
  isSearchable,
  normalizeQuery,
  suggestionValues,
  toggleSuggestion,
} from "../utils/search"
import { makeStyles } from "./stylesheets/SearchScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "Search">

// Space between the expanded top bar and the first card.
const CONTENT_TOP_GAP = 16

// Keyword search: type (or tap suggestions), then browse a random sample of
// the matches in Training's workout panel and list, with Shuffle for another
// sample. Searches only run on Search or return, never as the user types or
// taps suggestions, so the rate limit isn't spent on half-built queries.
export function SearchScreen({ navigation, route }: Props) {
  const topBar = useCollapsingTopBar()
  const insets = useSafeAreaInsets()
  const viewer = useWorkoutViewer(null, topBar.collapsedTopBarHeight)
  const { currentWorkout, isImageLoading } = viewer
  const { savedMap, saveForToday } = useSavedWorkouts()
  const inputRef = useRef<TextInput>(null)

  const [isDark, setIsDark] = useState<boolean>(route.params.isDark)
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  const [query, setQuery] = useState<string>("")
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  // The query the results are for. Shuffle repeats it, even if the field has
  // been edited since.
  const [resultsQuery, setResultsQuery] = useState<string>("")
  // Every result of the last search, the one on show included.
  const [results, setResults] = useState<Workout[]>([])
  // Empty until loaded, or when they can't be: the row is then just hidden.
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [noMatches, setNoMatches] = useState<boolean>(false)
  // The server doesn't have /search yet (it answers 404): say so in place of
  // the results, rather than an error on every try.
  const [unavailable, setUnavailable] = useState<boolean>(false)
  // Why the last search or suggestion tap didn't go through.
  const [notice, setNotice] = useState<string | null>(null)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)

  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])

  const isLoading = isSearching || isImageLoading
  const canSearch = isSearchable(query) && !isLoading
  const typedLength = normalizeQuery(query).length
  const otherResults = results.filter((workout) => workout.id !== currentWorkout?.id)

  const isCurrentSavedToday = Boolean(
    currentWorkout && (savedMap[todayKey()] ?? []).some((w) => w.id === currentWorkout.id),
  )
  const previousNotes = currentWorkout ? notesForExercise(savedMap, currentWorkout.id) : []

  useEffect(() => {
    getSearchSuggestions()
      .then((loaded) => setSuggestions(suggestionValues(loaded)))
      .catch(() => {
        // No suggestions row; typing still works.
      })
  }, [])

  // Dark mode can be changed from another screen's menu while this one stays
  // mounted underneath, so re-read it whenever it comes back into focus.
  useFocusEffect(
    useCallback(() => {
      readDarkMode()
        .then(setIsDark)
        .catch(() => {
          // Keep the current theme if the preference can't be read.
        })
    }, []),
  )

  async function runSearch(text: string): Promise<void> {
    const searchQuery = normalizeQuery(text)
    if (searchQuery.length < SEARCH_MIN_LENGTH || isLoading) return

    Keyboard.dismiss()
    setIsSearching(true)
    setNoMatches(false)
    setNotice(null)
    try {
      const found = await searchExercises(searchQuery)
      setResultsQuery(searchQuery)
      setResults(found)
      if (!found.length) {
        // Clear the old result: it no longer matches what was asked for.
        viewer.setCurrentWorkout(null)
        setNoMatches(true)
        return
      }
      // The server's order is already random: show the first.
      await viewer.loadListWorkout(found[0])
    } catch (error: unknown) {
      // Earlier results stay on screen; only the notice changes.
      if (error instanceof ApiError && error.status === 404) {
        setUnavailable(true)
      } else if (error instanceof ApiError && error.status === 429) {
        setNotice("That's a lot of searches in a short time. Try again in a few minutes.")
      } else {
        setNotice("Couldn't search just now. Check your connection and try again.")
      }
    } finally {
      setIsSearching(false)
    }
  }

  function onChangeQuery(text: string): void {
    setQuery(cleanSearchInput(text))
    setNotice(null)
  }

  function onPressSuggestion(value: string): void {
    const next = toggleSuggestion(query, value)
    if (next === null) {
      setNotice(`Searches can be up to ${SEARCH_MAX_LENGTH} characters.`)
      return
    }
    // Only edits the query: the search runs when the user taps Search or
    // return, so several suggestions can be combined first.
    setQuery(next)
    setNotice(null)
  }

  function clearQuery(): void {
    setQuery("")
    setNotice(null)
    setNoMatches(false)
    inputRef.current?.focus()
  }

  async function onSelectResult(item: Workout): Promise<void> {
    setIsSearching(true)
    try {
      await viewer.loadFullWorkout(item)
    } finally {
      setIsSearching(false)
    }
  }

  function openTraining(): void {
    navigation.navigate("Training")
  }

  function openTodaysWorkouts(): void {
    navigation.navigate("SavedWorkouts", { isDark })
  }

  function openCalendar(): void {
    navigation.navigate("SavedWorkouts", { isDark, initialView: "calendar" })
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

  const noticeText =
    notice ??
    (typedLength > 0 && typedLength < SEARCH_MIN_LENGTH
      ? `Type at least ${SEARCH_MIN_LENGTH} letters to search.`
      : null)

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
          // Suggestion and clear taps work while the keyboard is up.
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.controlSection}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel} nativeID="searchLabel" accessibilityRole="header">
                SEARCH EXERCISES
              </Text>
              <Text style={styles.counter}>
                {query.length} / {SEARCH_MAX_LENGTH}
              </Text>
            </View>
            <View style={styles.searchRow}>
              <View style={[styles.field, isInputFocused && styles.fieldFocused]}>
                <Feather name="search" size={18} color={palette.textMuted} />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={onChangeQuery}
                  onSubmitEditing={() => runSearch(query)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="e.g. dumbbell chest"
                  placeholderTextColor={palette.textMuted}
                  maxLength={SEARCH_MAX_LENGTH}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  style={styles.input}
                  accessibilityLabelledBy="searchLabel"
                  accessibilityLabel="Search exercises"
                />
                {query ? (
                  <Pressable
                    onPress={clearQuery}
                    style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={6}
                  >
                    <Feather name="x" size={14} color={palette.textMuted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => runSearch(query)}
                disabled={!canSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.pressed,
                  !canSearch && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSearch }}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>
            {noticeText ? <Text style={styles.notice}>{noticeText}</Text> : null}
          </View>

          {suggestions.length > 0 && !unavailable ? (
            <SuggestionPills
              palette={palette}
              values={suggestions}
              isActive={(value) => hasSuggestion(query, value)}
              onPress={onPressSuggestion}
              disabled={isLoading}
            />
          ) : null}

          {unavailable ? (
            <View style={styles.emptyCard} onLayout={viewer.onResultCardLayout}>
              <View style={styles.emptyIcon}>
                <Feather name="clock" size={20} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>Search isn't available yet</Text>
              <Text style={styles.emptyText}>
                It's on its way. Until then, Randomize can generate a workout for you.
              </Text>
            </View>
          ) : currentWorkout ? (
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
                <Feather name="search" size={20} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>No exercises match "{resultsQuery}"</Text>
              <Text style={styles.emptyText}>
                Try fewer words, check the spelling, or tap a suggestion.
              </Text>
              <View style={styles.emptyAction}>
                <ThemedButton
                  palette={palette}
                  label="Clear search"
                  icon="x"
                  variant="secondary"
                  onPress={clearQuery}
                />
              </View>
            </View>
          ) : (
            // Same slot as the result card, so its position is known before the
            // first search.
            <View style={styles.emptyCard} onLayout={viewer.onResultCardLayout}>
              <View style={styles.emptyIcon}>
                <Feather name="search" size={20} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>Search for an exercise</Text>
              <Text style={styles.emptyText}>
                Type a name, muscle or piece of equipment, or tap a suggestion.
              </Text>
            </View>
          )}

          {currentWorkout && !isSearching && !unavailable && (
            // Laid out as soon as the requests finish, so the page is at full
            // length when the image draws and the scroll runs. Hidden and not
            // tappable until then, it fades in with the card.
            <Animated.View
              style={{ opacity: viewer.resultOpacity }}
              pointerEvents={isImageLoading ? "none" : "auto"}
            >
              <SimilarWorkoutsList
                palette={palette}
                workouts={otherResults}
                onSelect={onSelectResult}
                showFilterTip={false}
                title="More matches"
                helperText={
                  results.length < SEARCH_SAMPLE_SIZE
                    ? `All ${results.length} matches. Tap one to view it.`
                    : "A random set of the matches. Tap one to view it."
                }
                emptyText="That's the only match."
                headerAction={
                  // Fewer than a full sample means every match is already
                  // here, so shuffling would only reorder them.
                  results.length >= SEARCH_SAMPLE_SIZE ? (
                    <Pressable
                      onPress={() => runSearch(resultsQuery)}
                      disabled={isLoading}
                      style={({ pressed }) => [
                        styles.shuffleButton,
                        pressed && styles.pressed,
                        isLoading && styles.disabled,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Shuffle: show a different set of matches"
                    >
                      <Feather name="shuffle" size={15} color={palette.accent} />
                      <Text style={styles.shuffleText}>Shuffle</Text>
                    </Pressable>
                  ) : null
                }
              />
            </Animated.View>
          )}
        </Animated.ScrollView>

        <CollapsingTopBar palette={palette} bar={topBar.bar} onOpenMenu={() => setMenuVisible(true)}>
          <NavCard
            palette={palette}
            icon="shuffle"
            title="Randomize"
            subtitle="Generate a workout"
            onPress={openTraining}
          />
          <NavCard
            palette={palette}
            icon="zap"
            title="Today's workouts"
            subtitle="Your plan"
            onPress={openTodaysWorkouts}
          />
        </CollapsingTopBar>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <ThemedButton
          palette={palette}
          label={isCurrentSavedToday ? "Saved" : "Save workout"}
          icon={isCurrentSavedToday ? "check" : "bookmark"}
          variant="action"
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
          { title: "Randomize", subtitle: "Generate a workout", icon: "shuffle", onPress: openTraining },
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
