import { useMemo, useRef, useState } from "react"
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
} from "react-native"

import { fonts, radius, type Palette } from "../theme"

// Indexes into `levels`, min <= max.
export interface LevelRange {
  min: number
  max: number
}

interface RangeSliderProps {
  palette: Palette
  levels: string[]
  value: LevelRange
  onChange: (value: LevelRange) => void
}

const HANDLE = 28
const DOT = 6
// Minimum touch target height for the track and the level labels.
const TOUCH = 44

// Two-handle slider that snaps to a small set of levels. Drag either handle to
// set a range; tap a level's button to pick just that level (tap it again to go
// back to all levels). Buttons for levels inside the range are highlighted.
export function RangeSlider({ palette, levels, value, onChange }: RangeSliderProps) {
  const [width, setWidth] = useState(0)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const last = levels.length - 1

  // The PanResponder is created once, so it reads current props through a ref.
  const latest = useRef({ value, onChange, width })
  latest.current = { value, onChange, width }
  const drag = useRef<{ startX: number; handle: "min" | "max" | null }>({
    startX: 0,
    handle: null,
  })

  const xOf = (index: number, trackWidth = width) =>
    HANDLE / 2 + (Math.max(trackWidth - HANDLE, 0) * index) / last

  const responder = useMemo(() => {
    const indexAt = (x: number) => {
      const usable = Math.max(latest.current.width - HANDLE, 1)
      return Math.min(last, Math.max(0, Math.round(((x - HANDLE / 2) / usable) * last)))
    }
    const moveTo = (x: number) => {
      const { value: current, onChange: change } = latest.current
      const index = indexAt(x)
      if (drag.current.handle === "min") {
        const min = Math.min(index, current.max)
        if (min !== current.min) change({ min, max: current.max })
      } else if (drag.current.handle === "max") {
        const max = Math.max(index, current.min)
        if (max !== current.max) change({ min: current.min, max })
      }
    }
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the gesture when the surrounding ScrollView asks for it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const x = event.nativeEvent.locationX
        const { value: current, width: trackWidth } = latest.current
        const minX = xOf(current.min, trackWidth)
        const maxX = xOf(current.max, trackWidth)
        drag.current.startX = x
        if (current.min === current.max && Math.abs(x - minX) < HANDLE / 2) {
          // Handles are stacked: decide which one from the drag direction.
          drag.current.handle = null
          return
        }
        drag.current.handle =
          current.min === current.max
            ? x < minX ? "min" : "max"
            : Math.abs(x - minX) <= Math.abs(x - maxX) ? "min" : "max"
        moveTo(x)
      },
      onPanResponderMove: (_event, gesture) => {
        if (!drag.current.handle) {
          if (Math.abs(gesture.dx) < 4) return
          drag.current.handle = gesture.dx < 0 ? "min" : "max"
        }
        moveTo(drag.current.startX + gesture.dx)
      },
    })
    // Only `last` is captured; everything that changes is read from refs, and
    // xOf is always given the current width explicitly.
  }, [last])

  function onTapLevel(index: number): void {
    const isOnlyThis = value.min === index && value.max === index
    onChange(isOnlyThis ? { min: 0, max: last } : { min: index, max: index })
  }

  function onAccessibilityAction(handle: "min" | "max", event: AccessibilityActionEvent): void {
    const step = event.nativeEvent.actionName === "increment" ? 1 : -1
    if (handle === "min") {
      const min = Math.min(Math.max(value.min + step, 0), value.max)
      if (min !== value.min) onChange({ min, max: value.max })
    } else {
      const max = Math.max(Math.min(value.max + step, last), value.min)
      if (max !== value.max) onChange({ min: value.min, max })
    }
  }

  const minX = xOf(value.min)
  const maxX = xOf(value.max)

  return (
    <View style={styles.root}>
      <View
        style={styles.trackArea}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.track} />
        <View style={[styles.activeTrack, { left: minX, width: maxX - minX }]} />
        {levels.map((level, index) => (
          <View
            key={level}
            style={[
              styles.dot,
              { left: xOf(index) - DOT / 2 },
              index >= value.min && index <= value.max ? styles.dotActive : null,
            ]}
          />
        ))}
        {(["min", "max"] as const).map((handle) => {
          const index = value[handle]
          return (
            <View
              key={handle}
              style={[styles.handle, { left: xOf(index) - HANDLE / 2 }]}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={handle === "min" ? "Lowest difficulty" : "Highest difficulty"}
              accessibilityValue={{ text: levels[index] }}
              accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
              onAccessibilityAction={(event) => onAccessibilityAction(handle, event)}
            />
          )
        })}
        {/* Transparent layer on top takes all touches, so drag positions are
            always measured against the whole track. */}
        <View style={StyleSheet.absoluteFill} accessible={false} {...responder.panHandlers} />
      </View>

      <View style={styles.levels}>
        {levels.map((level, index) => {
          const inRange = index >= value.min && index <= value.max
          return (
            <Pressable
              key={level}
              onPress={() => onTapLevel(index)}
              // 36pt button + 4pt slop on each side keeps the 44pt touch target.
              hitSlop={4}
              style={({ pressed }) => [
                styles.levelButton,
                inRange && styles.levelButtonActive,
                pressed && styles.levelButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${level} only`}
              accessibilityState={{ selected: inRange }}
            >
              <Text style={[styles.levelText, inRange && styles.levelTextActive]}>
                {level}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      gap: 6,
    },
    trackArea: {
      height: TOUCH,
      justifyContent: "center",
    },
    track: {
      position: "absolute",
      left: HANDLE / 2,
      right: HANDLE / 2,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: c.borderStrong,
    },
    activeTrack: {
      position: "absolute",
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: c.accent,
    },
    dot: {
      position: "absolute",
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      backgroundColor: c.textDisabled,
    },
    dotActive: {
      backgroundColor: c.onAccent,
    },
    handle: {
      position: "absolute",
      width: HANDLE,
      height: HANDLE,
      borderRadius: HANDLE / 2,
      backgroundColor: c.sliderHandle,
      borderWidth: 3,
      borderColor: c.accent,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    levels: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    levelButton: {
      minHeight: 36,
      minWidth: TOUCH,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSunken,
    },
    levelButtonActive: {
      borderColor: c.accent,
      backgroundColor: c.surface,
    },
    levelButtonPressed: {
      opacity: 0.7,
    },
    levelText: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    levelTextActive: {
      color: c.accent,
      fontFamily: fonts.bold,
    },
  })
}
