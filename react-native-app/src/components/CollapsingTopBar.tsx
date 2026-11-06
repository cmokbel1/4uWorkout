import { Feather } from "@expo/vector-icons"
import { useMemo, useRef, useState, type ReactNode } from "react"
import { Animated, Pressable, StyleSheet, View } from "react-native"

import { fonts, type Palette } from "../theme"

// Its real size is measured; this is only the first-frame guess (so the
// content doesn't start underneath it).
const TOP_BAR_HEIGHT_ESTIMATE = 187
// The space above the nav cards: 16 either side of the 1px header divider, as
// under the Calendar's header.
const TOP_BAR_GAP = 33
// How small "Trainer" gets when the bar is collapsed.
const COLLAPSED_TITLE_SCALE = 0.72

// The Training screen's collapsing top bar, driven by the scroll position on
// the native thread. As the content scrolls up by `collapseDistance`, the nav
// cards slide up behind the title row and fade, and "Trainer" shrinks toward
// its bottom-left. The app name stays visible at full size: it slides down by
// the space the shrinking title gives up, so it stays right above it. The
// whole bar (background and divider) slides up by `collapseDistance` while the
// title row is shifted back down by `navCollapse`, so the row rises only by
// that freed space — leaving a slim bar that still reads "4UWORKOUT / Trainer".
// The bar floats over the content, so its size never changes the scroll
// view's layout.
//
// Pass `onScroll` to an Animated.ScrollView, pad its content by `topBarHeight`,
// and render <CollapsingTopBar bar={bar}> over it.
export function useCollapsingTopBar() {
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

  const transforms = useMemo(() => {
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
    bar: { ...transforms, setTopBarHeight, setNavRowHeight, setTitleHeight },
  }
}

interface CollapsingTopBarProps {
  palette: Palette
  bar: ReturnType<typeof useCollapsingTopBar>["bar"]
  onOpenMenu: () => void
  // The nav cards, which fold away as the bar collapses.
  children: ReactNode
}

export function CollapsingTopBar({ palette, bar, onOpenMenu, children }: CollapsingTopBarProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <Animated.View
      style={[styles.topBar, { transform: [{ translateY: bar.barShift }] }]}
      onLayout={(event) => bar.setTopBarHeight(event.nativeEvent.layout.height)}
    >
      <Animated.View style={[styles.header, { transform: [{ translateY: bar.headerShift }] }]}>
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
        {/* Divider between the header and the nav cards, as on the Calendar.
            Fades with the cards, leaving only the bar's own bottom edge when
            collapsed. */}
        <Animated.View style={[styles.headerDivider, { opacity: bar.navOpacity }]} />
      </Animated.View>

      <Animated.View
        style={[styles.navRow, { opacity: bar.navOpacity }]}
        onLayout={(event) => bar.setNavRowHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </Animated.View>
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
      gap: TOP_BAR_GAP,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    // Sits above the nav cards, which slide up behind it as the bar collapses.
    header: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      zIndex: 1,
      backgroundColor: c.bg,
    },
    // Full width (past the bar's padding), centred in the gap under the
    // header, matching ScreenHeader's divider.
    headerDivider: {
      position: "absolute",
      left: -20,
      right: -20,
      bottom: -17,
      height: 1,
      backgroundColor: c.border,
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
    navRow: {
      flexDirection: "row",
      gap: 12,
    },
  })
}
