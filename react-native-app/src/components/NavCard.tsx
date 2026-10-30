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
  // The highlighted card is filled with the accent color.
  highlighted?: boolean
}

// Large shortcut tile (icon in a circle, title, subtitle) used for top-level
// navigation on the Training screen.
export function NavCard({
  palette,
  title,
  subtitle,
  icon,
  onPress,
  highlighted = false,
}: NavCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highlighted
          ? { backgroundColor: palette.accent, borderColor: palette.accent }
          : { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: highlighted ? palette.onAccent : palette.surfaceRaised },
        ]}
      >
        <Feather
          name={icon}
          size={17}
          color={highlighted ? palette.accent : palette.text}
        />
      </View>
      <View style={styles.text}>
        <Text
          style={[styles.title, { color: highlighted ? palette.onAccent : palette.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: highlighted ? palette.onAccentMuted : palette.textMuted },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
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
