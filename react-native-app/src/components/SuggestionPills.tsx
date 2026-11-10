import { Feather } from "@expo/vector-icons"
import { useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"

interface SuggestionPillsProps {
  palette: Palette
  values: string[]
  // Whether a value's words are already in the query (shown highlighted).
  isActive: (value: string) => boolean
  onPress: (value: string) => void
  disabled: boolean
}

// Search's row of common words (equipment, body parts, targets), scrolling
// sideways. Tapping one adds it to the query; tapping a highlighted one takes
// it out again.
export function SuggestionPills({ palette, values, isActive, onPress, disabled }: SuggestionPillsProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <View style={styles.section}>
      <Text style={styles.label}>SUGGESTIONS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Runs to the screen edges (past the content's padding) so it reads
        // as scrollable.
        style={styles.scroll}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {values.map((value) => {
          const active = isActive(value)
          return (
            <Pressable
              key={value}
              onPress={() => onPress(value)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                (pressed || disabled) && styles.dimmed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={active ? `Remove ${value} from search` : `Add ${value} to search`}
            >
              {active && <Feather name="check" size={14} color={palette.accent} />}
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{value}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    section: {
      gap: 8,
    },
    label: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1,
    },
    scroll: {
      marginHorizontal: -20,
    },
    row: {
      gap: 8,
      paddingHorizontal: 20,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    pillActive: {
      backgroundColor: c.onAccentMuted,
      borderColor: c.accent,
    },
    dimmed: {
      opacity: 0.6,
    },
    pillText: {
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    pillTextActive: {
      color: c.accent,
      fontFamily: fonts.bold,
    },
  })
}
