import { Feather } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, GUTTER, radius, type Palette } from "../theme"

export type SavedView = "day" | "calendar"

const VIEWS: { value: SavedView; label: string; icon: ComponentProps<typeof Feather>["name"] }[] = [
  { value: "day", label: "Day", icon: "list" },
  { value: "calendar", label: "Calendar", icon: "calendar" },
]

interface SavedViewSwitchProps {
  palette: Palette
  value: SavedView
  onChange: (view: SavedView) => void
}

// The Saved tab's Day | Calendar switch, in its own bar right under the header
// on both views: outside their scrolling content, so it's always in reach, and
// in the same place on each, so it doesn't move when the view changes. They're
// two views of one place, so this switches between them rather than
// navigating. The chosen side sits on an accent-tinted pill, like the focused
// tab icon.
export function SavedViewSwitch({ palette, value, onChange }: SavedViewSwitchProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <View style={styles.bar}>
      <View style={styles.track} accessibilityRole="tablist">
        {VIEWS.map((view) => {
          const selected = view.value === value
          const color = selected ? palette.onAccentTint : palette.textMuted
          return (
            <Pressable
              key={view.value}
              onPress={() => {
                if (!selected) onChange(view.value)
              }}
              style={({ pressed }) => [
                styles.segment,
                selected && styles.segmentSelected,
                pressed && !selected && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityLabel={view.label}
              accessibilityState={{ selected }}
            >
              <Feather name={view.icon} size={16} color={color} />
              <Text style={[styles.label, { color }]}>{view.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    // Full width, with a divider under it like the header's, so the content
    // scrolling below reads as separate from it.
    bar: {
      paddingHorizontal: GUTTER,
      paddingVertical: 12,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    track: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
    },
    segment: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 40,
      borderRadius: radius.md - 4,
    },
    segmentSelected: {
      backgroundColor: c.accentTint,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      fontFamily: fonts.bold,
      fontSize: 15,
    },
  })
}
