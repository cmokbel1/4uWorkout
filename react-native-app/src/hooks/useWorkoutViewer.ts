import { useRef, useState } from "react"
import { Animated, type LayoutChangeEvent, type ScrollView } from "react-native"

import { getExerciseById, getExerciseImageById } from "../services/workoutApi"
import type { Workout } from "../types/workout"

// Gap left above the result card when it's scrolled to just below the top bar.
const RESULT_SCROLL_MARGIN = 12

// The workout a screen shows in its result card (Training, Search): loading
// it, hiding it until its image has drawn, fading it in, and scrolling the
// card to just below the collapsed top bar.
//
// A workout only counts as loaded once its GIF has been decoded and drawn —
// the base64 image arrives with the request but takes a moment to render. The
// screen ORs `isImageLoading` with its own request flag; onResultImageLoad
// (the card's WorkoutPanel onImageLoad) is the one trigger that ends loading.
//
// `initialWorkout` is one restored from a session; it starts hidden and fades
// in once its image draws, like any other.
export function useWorkoutViewer(initialWorkout: Workout | null, collapsedTopBarHeight: number) {
  const scrollViewRef = useRef<ScrollView>(null)
  // Where the result card sits in the scroll content (from its onLayout).
  const resultCardYRef = useRef<number>(0)
  // Set when a workout is being loaded; cleared once it has been scrolled to.
  const scrollToResultPendingRef = useRef<boolean>(false)
  // Used to keep scroll targets within the content: scrollTo doesn't stop at
  // the end of the content on iOS.
  const contentHeightRef = useRef<number>(0)
  const viewportHeightRef = useRef<number>(0)
  const resultOpacity = useRef(new Animated.Value(initialWorkout ? 0 : 1)).current

  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(initialWorkout)
  // Id of the workout whose image has finished drawing.
  const [loadedImageId, setLoadedImageId] = useState<string | null>(null)

  const isImageLoading = Boolean(currentWorkout?.gifUrl) && loadedImageId !== currentWorkout?.id

  // Scroll position that puts the result card's top just below the top bar.
  // The card sits far enough down that the bar is fully collapsed by then, so
  // it's the collapsed bar's height that the card has to clear.
  function resultScrollTarget(): number {
    return Math.max(resultCardYRef.current - collapsedTopBarHeight - RESULT_SCROLL_MARGIN, 0)
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
    // screen when loading began; the screen disables its controls until
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
  // lists under the card were laid out with them, so the page is at full
  // length: fade the card in, then scroll to it.
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

  function onScrollViewLayout(event: LayoutChangeEvent): void {
    viewportHeightRef.current = event.nativeEvent.layout.height
  }

  function onContentSizeChange(_width: number, height: number): void {
    contentHeightRef.current = height
  }

  // Marks that the workout being loaded should be scrolled to once shown. When
  // one is already showing (picking from the list under it) the page is long
  // enough to scroll now, which brings its loading spinner into view. On the
  // first load it isn't, so it waits for a single smooth scroll at the end.
  function beginLoadingWorkout(): void {
    scrollToResultPendingRef.current = true
    if (currentWorkout) scrollResultCardIntoPlace()
  }

  // Shows a list item (from a search) by fetching only its image: list items
  // already carry the fields the card needs. Throws if the image can't be
  // fetched (an ApiError for an HTTP failure, e.g. 429), so the search can say so.
  async function loadListWorkout(workout: Workout): Promise<void> {
    beginLoadingWorkout()
    const imageUrl = await getExerciseImageById(workout.id)
    showWorkout({ ...workout, gifUrl: imageUrl })
  }

  // Shows a list item with its full record (falling back to just its image).
  async function loadFullWorkout(item: Workout): Promise<void> {
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
    }
  }

  return {
    currentWorkout,
    // For clearing the card (a search that matched nothing).
    setCurrentWorkout,
    isImageLoading,
    resultOpacity,
    scrollViewRef,
    onScrollViewLayout,
    onContentSizeChange,
    onResultCardLayout,
    onResultImageLoad,
    loadListWorkout,
    loadFullWorkout,
  }
}
