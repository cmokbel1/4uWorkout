import { useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from "react"
import { ScrollView, StyleSheet, View } from "react-native"

import { GUTTER, radius, type Palette } from "../theme"

// Space between the frame and the cards in it.
const FRAME_PADDING = 8

// Layout sizes and offsets are fractional, so "more to scroll" allows this
// much slack before counting.
const SCROLL_EPSILON = 1

export interface ScrollFrameHandle {
  // Scrolls just enough to show a child laid out at `y` with `height` (from
  // its onLayout, relative to the frame's content).
  reveal: (y: number, height: number) => void
}

interface ScrollFrameProps {
  palette: Palette
  ref?: Ref<ScrollFrameHandle>
  children: ReactNode
}

// A bordered frame that fills the rest of the screen and scrolls its children
// on its own, so the frame's edge shows where the list stops. While there's
// more to scroll, that edge fades out, and the scroll bar flashes once when
// the content first runs past the frame. Used for the day view's workouts.
export function ScrollFrame({ palette, ref, children }: ScrollFrameProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const scrollRef = useRef<ScrollView>(null)
  // Sizes and offset are refs, so scrolling only re-renders when a fade
  // appears or goes.
  const frameHeight = useRef(0)
  const contentHeight = useRef(0)
  const scrollY = useRef(0)
  const wasOverflowing = useRef(false)
  const [moreAbove, setMoreAbove] = useState(false)
  const [moreBelow, setMoreBelow] = useState(false)

  // Shows the whole child, with the frame's padding around it. A child taller
  // than the frame is shown from its top. Does nothing when it already fits.
  useImperativeHandle(ref, () => ({
    reveal(y, height) {
      const top = y - FRAME_PADDING
      const bottom = y + height + FRAME_PADDING
      const viewTop = scrollY.current
      let target = viewTop
      if (bottom > viewTop + frameHeight.current) target = bottom - frameHeight.current
      if (top < target) target = top
      if (target !== viewTop) scrollRef.current?.scrollTo({ y: Math.max(target, 0), animated: true })
    },
  }))

  function updateFades(): void {
    setMoreAbove(scrollY.current > SCROLL_EPSILON)
    setMoreBelow(contentHeight.current - scrollY.current - frameHeight.current > SCROLL_EPSILON)
  }

  function flashIfNewlyOverflowing(): void {
    const overflowing = contentHeight.current > frameHeight.current + SCROLL_EPSILON
    if (overflowing && !wasOverflowing.current) scrollRef.current?.flashScrollIndicators()
    wasOverflowing.current = overflowing
  }

  return (
    <View style={styles.frame}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        // iOS: insets the content by the keyboard's overlap and keeps the
        // focused field (a set's reps or weight) above it.
        automaticallyAdjustKeyboardInsets
        scrollEventThrottle={16}
        onLayout={(event) => {
          frameHeight.current = event.nativeEvent.layout.height
          updateFades()
          flashIfNewlyOverflowing()
        }}
        onContentSizeChange={(_, height) => {
          contentHeight.current = height
          updateFades()
          flashIfNewlyOverflowing()
        }}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y
          updateFades()
        }}
      >
        {children}
      </ScrollView>
      {moreAbove ? <View pointerEvents="none" style={[styles.fade, styles.fadeTop]} /> : null}
      {moreBelow ? <View pointerEvents="none" style={[styles.fade, styles.fadeBottom]} /> : null}
    </View>
  )
}

// The fades go from fully transparent to the frame's fill. Two assumptions:
// palette colours are 6-digit hex (so "00" appended makes a transparent
// version of the same colour), and the New Architecture is on
// (experimental_backgroundImage needs it; without it the fades don't draw).
function makeStyles(c: Palette) {
  const fill = c.surfaceSunken
  return StyleSheet.create({
    // Lines the cards inside up with the screen's gutter; its corners follow
    // theirs, outset by the padding.
    frame: {
      flex: 1,
      marginHorizontal: GUTTER - FRAME_PADDING,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: radius.lg + FRAME_PADDING,
      backgroundColor: fill,
      overflow: "hidden",
    },
    content: {
      padding: FRAME_PADDING,
      gap: 12,
    },
    fade: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 28,
    },
    fadeTop: {
      top: 0,
      experimental_backgroundImage: `linear-gradient(to top, ${fill}00, ${fill})`,
    },
    fadeBottom: {
      bottom: 0,
      experimental_backgroundImage: `linear-gradient(to bottom, ${fill}00, ${fill})`,
    },
  })
}
