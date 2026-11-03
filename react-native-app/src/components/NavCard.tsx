import { Feather } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"

interface NavCardProps {
  palette: Palette
  title: string
  subtitle: string
  icon: ComponentProps<typeof Feather>["name"]
  onPress: () => void
}

// Large shortcut tile (icon in a circle with an arrow opposite, then title and
// subtitle) used for top-level navigation. Every card looks the same, so none
// looks like the current screen.
export function NavCard({ palette, title, subtitle, icon, onPress }: NavCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.navCard,
          borderColor: palette.navCardBorder,
          borderTopColor: palette.navCardTopEdge,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: palette.navCardIcon }]}>
          <Feather name={icon} size={17} color={palette.text} />
        </View>
        <Feather name="arrow-up-right" size={16} color={palette.textMuted} />
      </View>
      <View>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    // Lifts the card so it reads as tappable. shadow* is iOS, elevation is
    // Android.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  // The shadow drops while pressed, so the card looks pushed in.
  pressed: {
    opacity: 0.85,
    shadowOpacity: 0,
    elevation: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
})
