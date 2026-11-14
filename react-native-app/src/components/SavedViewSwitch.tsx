import { Feather } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"

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

// The Saved tab's Day | Calendar switch, at the top of both views. They're two
// views of one place, so this switches between them rather than navigating.
// The chosen side sits on an accent-tinted pill, like the focused tab icon.
export function SavedViewSwitch({ palette, value, onChange }: SavedViewSwitchProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
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
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
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
