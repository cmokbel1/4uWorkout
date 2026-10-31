import { Feather } from "@expo/vector-icons"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, type Palette } from "../theme"

interface ScreenHeaderProps {
  palette: Palette
  // Shown under the 4UWORKOUT brand label, e.g. "Trainer".
  title: string
  // Shows a round back button left of the title.
  onBack?: () => void
  // Shows the cog button on the right.
  onOpenMenu?: () => void
}

// Fixed header for the redesigned screens: brand label and title, with an
// optional back button and cog, over a divider. (Training has its own,
// collapsing version.)
export function ScreenHeader({ palette, title, onBack, onOpenMenu }: ScreenHeaderProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <View style={styles.topBar}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Feather name="chevron-left" size={22} color={palette.text} />
            </Pressable>
          ) : null}
          <View>
            <Text style={styles.brand}>4UWORKOUT</Text>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          </View>
        </View>
        {onOpenMenu ? (
          <Pressable
            onPress={onOpenMenu}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            <Feather name="settings" size={20} color={palette.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    topBar: {
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
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    brand: {
      color: c.accent,
      fontFamily: fonts.extrabold,
      fontSize: 13,
      letterSpacing: 1.4,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 34,
      lineHeight: 40,
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
