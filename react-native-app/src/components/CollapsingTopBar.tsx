import { Feather } from "@expo/vector-icons"
import { useMemo, useRef, useState } from "react"
import { Animated, Pressable, StyleSheet, View } from "react-native"

import { fonts, type Palette } from "../theme"

// Its real size is measured; this is only the first-frame guess (so the
// content doesn't start underneath it).
const TOP_BAR_HEIGHT_ESTIMATE = 87
// How small "Trainer" gets when the bar is collapsed.
const COLLAPSED_TITLE_SCALE = 0.72

// The collapsing top bar of the Randomize (Training) and Search tabs, driven
// by the scroll position on the native thread. As the content scrolls up by
// `collapseDistance`, "Trainer" shrinks toward its bottom-left and the bar
// (background and divider) slides up by the height it gives up. The app name
// stays visible at full size: it slides down by that same space, so it stays
// right above the title — leaving a slimmer bar that still reads
// "4UWORKOUT / Trainer". The bar floats over the content, so its size never
// changes the scroll view's layout.
//
// Pass `onScroll` to an Animated.ScrollView, pad its content by `topBarHeight`,
// and render <CollapsingTopBar bar={bar}> over it.
export function useCollapsingTopBar() {
  const scrollY = useRef(new Animated.Value(0)).current
  const [topBarHeight, setTopBarHeight] = useState<number>(TOP_BAR_HEIGHT_ESTIMATE)
  const [titleHeight, setTitleHeight] = useState<number>(0)
  // Height "Trainer" gives up when it shrinks. Clamped to 1 so the
  // interpolations below stay valid before measuring.
  const collapseDistance = Math.max(titleHeight * (1 - COLLAPSED_TITLE_SCALE), 1)
  const collapsedTopBarHeight = topBarHeight - collapseDistance

  const transforms = useMemo(() => {
    const range = (output: number[]) =>
      scrollY.interpolate({
        inputRange: [0, collapseDistance],
        outputRange: output,
        extrapolate: "clamp",
      })
    return {
      barShift: range([0, -collapseDistance]),
      brandShift: range([0, collapseDistance]),
      titleScale: range([1, COLLAPSED_TITLE_SCALE]),
    }
  }, [scrollY, collapseDistance])

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  )

  return {
    topBarHeight,
    collapsedTopBarHeight,
    onScroll,
    bar: { ...transforms, setTopBarHeight, setTitleHeight },
  }
}

interface CollapsingTopBarProps {
  palette: Palette
  bar: ReturnType<typeof useCollapsingTopBar>["bar"]
  onOpenMenu: () => void
}

export function CollapsingTopBar({ palette, bar, onOpenMenu }: CollapsingTopBarProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <Animated.View
      style={[styles.topBar, { transform: [{ translateY: bar.barShift }] }]}
      onLayout={(event) => bar.setTopBarHeight(event.nativeEvent.layout.height)}
    >
      <View style={styles.header}>
        <View>
          <Animated.Text style={[styles.brand, { transform: [{ translateY: bar.brandShift }] }]}>
            4UWORKOUT
          </Animated.Text>
          <Animated.Text
            style={[styles.title, { transform: [{ scale: bar.titleScale }] }]}
            onLayout={(event) => bar.setTitleHeight(event.nativeEvent.layout.height)}
            accessibilityRole="header"
          >
            Trainer
          </Animated.Text>
        </View>
        <Pressable
          onPress={onOpenMenu}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Feather name="settings" size={20} color={palette.text} />
        </Pressable>
      </View>
    </Animated.View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    // Floats over the content (which is padded to start below it) so resizing
    // it never moves the scroll view. Mirrors the bottom bar (same background,
    // divider facing the content).
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    brand: {
      color: c.accent,
      fontFamily: fonts.extrabold,
      fontSize: 13,
      letterSpacing: 1.4,
    },
    // Shrinks toward its bottom-left corner, staying in line with the
    // settings button.
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 34,
      lineHeight: 40,
      transformOrigin: "left bottom",
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: {
      opacity: 0.75,
    },
  })
}
