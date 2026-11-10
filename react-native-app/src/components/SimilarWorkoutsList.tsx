import { Feather } from "@expo/vector-icons"
import { useMemo, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"

interface SimilarWorkoutsListProps {
  palette: Palette
  workouts: Workout[]
  onSelect: (workout: Workout) => void
  // Shows advice about widening the filters under the list.
  showFilterTip: boolean
  // Search's wording; Training uses the defaults.
  title?: string
  helperText?: string
  emptyText?: string
  // Shown at the right of the heading (Search's Shuffle button).
  headerAction?: ReactNode
}

// The "Similar workouts" section on Training (and "More matches" on Search):
// a numbered list of the other matches from the last search.
export function SimilarWorkoutsList({
  palette,
  workouts,
  onSelect,
  showFilterTip,
  title = "Similar workouts",
  helperText = "Tap one for more information.",
  emptyText = "No other workouts match these filters.",
  headerAction,
}: SimilarWorkoutsListProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.helperText}>{workouts.length ? helperText : emptyText}</Text>
        </View>
        {headerAction}
      </View>
      {workouts.length ? (
        <View style={styles.list}>
          {workouts.map((item, idx) => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              accessibilityLabel={`Select ${item.name}`}
              accessibilityRole="button"
            >
              <View style={styles.index}>
                <Text style={styles.indexText}>{idx + 1}</Text>
              </View>
              <View style={styles.text}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.sub}>Target: {item.target}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={palette.textMuted} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {showFilterTip ? (
        <View style={styles.tip}>
          <Feather name="info" size={16} color={palette.accent} />
          <Text style={styles.tipText}>
            If you're stuck and the similar workouts list is too short,
            update your filters and try again, or change body part.
          </Text>
        </View>
      ) : null}
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    // Same spacing as the screen content's gap.
    section: {
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
    },
    header: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
    },
    helperText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    list: {
      gap: 10,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    pressed: {
      opacity: 0.75,
    },
    index: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    indexText: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    name: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
      textTransform: "capitalize",
    },
    sub: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      textTransform: "capitalize",
    },
    tip: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: 14,
    },
    tipText: {
      flex: 1,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
    },
  })
}
