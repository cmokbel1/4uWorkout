import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Animated, Keyboard, Pressable, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"

import { AppMenu } from "../components/AppMenu"
import { CollapsingTopBar, useCollapsingTopBar } from "../components/CollapsingTopBar"
import { SaveWorkoutModal } from "../components/SaveWorkoutModal"
import { SimilarWorkoutsList } from "../components/SimilarWorkoutsList"
import { SuggestionPills } from "../components/SuggestionPills"
import { ThemedButton } from "../components/ThemedButton"
import { WorkoutPanel } from "../components/WorkoutPanel"
import { useSavedWorkouts } from "../hooks/useSavedWorkouts"
import { useTabBarTheme } from "../hooks/useTabBarTheme"
import { useWorkoutViewer } from "../hooks/useWorkoutViewer"
import { ApiError, getSearchSuggestions, searchExercises } from "../services/workoutApi"
import { searchSession } from "../state/searchSession"
import { notesForExercise } from "../storage/savedWorkouts"
import { getLastKnownDarkMode, readDarkMode, writeDarkMode } from "../storage/theme"
import { getPalette } from "../theme"
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, SEARCH_SAMPLE_SIZE } from "../types/search"
import type { Workout, WorkoutSet } from "../types/workout"
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

// Space between the expanded top bar and the first card.
const CONTENT_TOP_GAP = 16

// Keyword search: type (or tap suggestions), then browse the matches (closest
// names first) in Training's workout panel and list, with Shuffle for another
// mix. Searches only run on Search or return, never as the user types or
// taps suggestions, so the rate limit isn't spent on half-built queries.
export function SearchScreen() {
  const topBar = useCollapsingTopBar()
  // The workout on show, hydrated from the session so it survives a remount.
  const viewer = useWorkoutViewer(searchSession.currentWorkout, topBar.collapsedTopBarHeight)
  const { currentWorkout, isImageLoading } = viewer
  const { savedMap, saveForToday } = useSavedWorkouts()
  const inputRef = useRef<TextInput>(null)

  // Re-read on focus below; this avoids flashing the light theme first.
  const [isDark, setIsDark] = useState<boolean>(getLastKnownDarkMode)
  const [menuVisible, setMenuVisible] = useState<boolean>(false)
  // Hydrated from the session, like the results below.
  const [query, setQuery] = useState<string>(() => searchSession.query)
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  // The query the results are for. Shuffle repeats it, even if the field has
  // been edited since.
  const [resultsQuery, setResultsQuery] = useState<string>(() => searchSession.resultsQuery)
  // Every result of the last search, the one on show included.
  const [results, setResults] = useState<Workout[]>(() => searchSession.results)
  // Empty until loaded, or when they can't be: the row is then just hidden.
  const [suggestions, setSuggestions] = useState<string[]>(() => searchSession.suggestions ?? [])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [noMatches, setNoMatches] = useState<boolean>(false)
  // The server doesn't have /search yet (it answers 404): say so in place of
  // the results, rather than an error on every try.
  const [unavailable, setUnavailable] = useState<boolean>(false)
  // Why the last search or suggestion tap didn't go through.
  const [notice, setNotice] = useState<string | null>(null)
  // A short pause after each search (as on Randomize's Find), so repeated
  // taps don't spend the rate limit.
  const [isSearchCoolingDown, setIsSearchCoolingDown] = useState<boolean>(false)
  const searchCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The info button's tip: why Search is off for the same words, and Shuffle.
  const [showSearchTip, setShowSearchTip] = useState<boolean>(false)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)

  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  useTabBarTheme(palette)

  const isLoading = isSearching || isImageLoading
  // The field still holds the search on screen (the server ignores case), so
  // searching again would only reshuffle: that's Shuffle's job.
  const isSameSearch = normalizeQuery(query).toLowerCase() === resultsQuery.toLowerCase()
  const canSearch = isSearchable(query) && !isLoading && !isSearchCoolingDown && !isSameSearch
  const typedLength = normalizeQuery(query).length
  // The server fills out a search with few matches with exercises like the
  // closest one, flagged `similar`; they're listed apart from the matches.
  const matches = results.filter((workout) => !workout.similar)
  const otherMatches = matches.filter((workout) => workout.id !== currentWorkout?.id)
  const otherSimilar = results.filter((workout) => workout.similar && workout.id !== currentWorkout?.id)

  const isCurrentSavedToday = Boolean(
    currentWorkout && (savedMap[todayKey()] ?? []).some((w) => w.id === currentWorkout.id),
  )
  const previousNotes = currentWorkout ? notesForExercise(savedMap, currentWorkout.id) : []

  // Fetched once per session. A failure leaves session.suggestions null, so
  // the next mount retries; until then there's no row, and typing still works.
  useEffect(() => {
    if (searchSession.suggestions) return
    getSearchSuggestions()
      .then((loaded) => {
        const values = suggestionValues(loaded)
        searchSession.suggestions = values
        setSuggestions(values)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (searchCooldownRef.current) clearTimeout(searchCooldownRef.current)
    }
  }, [])

  // Keep the session snapshot in sync so a later remount can restore it.
  useEffect(() => {
    searchSession.query = query
    searchSession.resultsQuery = resultsQuery
    searchSession.results = results
    searchSession.currentWorkout = currentWorkout
  }, [query, resultsQuery, results, currentWorkout])

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
    if (searchQuery.length < SEARCH_MIN_LENGTH || isLoading || isSearchCoolingDown) return

    Keyboard.dismiss()
    setShowSearchTip(false)
    setIsSearching(true)
    setNoMatches(false)
    setNotice(null)
    // Set once the search itself has answered, so a 404 for the image (a
    // missing GIF) isn't taken for a server without /search.
    let searched = false
    try {
      const found = await searchExercises(searchQuery)
      searched = true
      if (!found.length) {
        // Clear the old result: it no longer matches what was asked for.
        setResultsQuery(searchQuery)
        setResults(found)
        viewer.setCurrentWorkout(null)
        setNoMatches(true)
        return
      }
      // The server puts the closest match first: show it. The new list only
      // replaces the old one once its image is in, so a failed image (often
      // the rate limit, as it's the search's second request) leaves the
      // previous search on screen, consistent, with the notice explaining.
      await viewer.loadListWorkout(found[0])
      setResultsQuery(searchQuery)
      setResults(found)
    } catch (error: unknown) {
      // Earlier results stay on screen; only the notice changes.
      if (!searched && error instanceof ApiError && error.status === 404) {
        setUnavailable(true)
      } else if (error instanceof ApiError && error.status === 429) {
        setNotice("That's a lot of searches in a short time. Try again in a few minutes.")
      } else {
        setNotice("Couldn't search just now. Check your connection and try again.")
      }
    } finally {
      setIsSearching(false)
      setIsSearchCoolingDown(true)
      searchCooldownRef.current = setTimeout(() => setIsSearchCoolingDown(false), 3000)
    }
  }

  // Search button and return: only for a changed query (see canSearch).
  function submitSearch(): void {
    if (canSearch) runSearch(query)
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

  // Why Search is greyed out when the field holds the search on screen.
  // Fewer than a full sample is every match, and Shuffle is hidden then.
  const sameSearchHint =
    isSameSearch && results.length > 0 && !isLoading
      ? matches.length >= SEARCH_SAMPLE_SIZE
        ? "Showing results for these words. Tap Shuffle for others."
        : "Showing every match for these words."
      : null

  const noticeText =
    notice ??
    (typedLength > 0 && typedLength < SEARCH_MIN_LENGTH
      ? `Type at least ${SEARCH_MIN_LENGTH} letters to search.`
      : sameSearchHint)

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
              <View style={styles.labelGroup}>
                <Text style={styles.sectionLabel} nativeID="searchLabel" accessibilityRole="header">
                  SEARCH EXERCISES
                </Text>
                <Pressable
                  onPress={() => setShowSearchTip((shown) => !shown)}
                  style={({ pressed }) => [styles.tipButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Search tips"
                  accessibilityHint="Explains how to see other workouts for the same search"
                  accessibilityState={{ expanded: showSearchTip }}
                  hitSlop={12}
                >
                  <Feather name="info" size={15} color={showSearchTip ? palette.accent : palette.textMuted} />
                </Pressable>
              </View>
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
                  onSubmitEditing={submitSearch}
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
                onPress={submitSearch}
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
            {showSearchTip ? (
              <View style={styles.tip}>
                <Feather name="shuffle" size={15} color={palette.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  Each search runs once. For other matches with the same words, tap Shuffle above the
                  list (it shows when there are more than 10 matches). For a random workout, use the
                  Randomize tab.
                </Text>
                <Pressable
                  onPress={() => setShowSearchTip(false)}
                  style={({ pressed }) => [styles.tipClose, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close tip"
                  hitSlop={10}
                >
                  <Feather name="x" size={16} color={palette.textMuted} />
                </Pressable>
              </View>
            ) : null}
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
              style={[styles.resultLists, { opacity: viewer.resultOpacity }]}
              pointerEvents={isImageLoading ? "none" : "auto"}
            >
              {/* With similar workouts to show, a lone match needs no "That's
                  the only match" list above them. */}
              {otherMatches.length > 0 || otherSimilar.length === 0 ? (
                <SimilarWorkoutsList
                  palette={palette}
                  workouts={otherMatches}
                  onSelect={onSelectResult}
                  showFilterTip={false}
                  title="More matches"
                  helperText={
                    matches.length < SEARCH_SAMPLE_SIZE
                      ? `All ${matches.length} matches. Tap one to view it.`
                      : "The closest matches, then a mix. Tap one to view it."
                  }
                  emptyText="That's the only match."
                  headerAction={
                    // Fewer than a full sample means every match is already
                    // here, so shuffling would only reorder them.
                    matches.length >= SEARCH_SAMPLE_SIZE ? (
                      <Pressable
                        onPress={() => runSearch(resultsQuery)}
                        disabled={isLoading || isSearchCoolingDown}
                        style={({ pressed }) => [
                          styles.shuffleButton,
                          pressed && styles.pressed,
                          (isLoading || isSearchCoolingDown) && styles.disabled,
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
              ) : null}
              {otherSimilar.length > 0 ? (
                <SimilarWorkoutsList
                  palette={palette}
                  workouts={otherSimilar}
                  onSelect={onSelectResult}
                  showFilterTip={false}
                  title="Similar workouts"
                  helperText={
                    matches.length === 1
                      ? `Not matches, but like ${matches[0].name}. Tap one to view it.`
                      : "Not matches, but like the closest one. Tap one to view it."
                  }
                />
              ) : null}
            </Animated.View>
          )}
        </Animated.ScrollView>

        <CollapsingTopBar palette={palette} bar={topBar.bar} onOpenMenu={() => setMenuVisible(true)} />
      </View>

      <View style={styles.bottomBar}>
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
