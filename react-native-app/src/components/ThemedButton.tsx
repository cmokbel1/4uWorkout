import { Feather } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native"

import { fonts, radius, type Palette } from "../theme"

interface ThemedButtonProps {
  palette: Palette
  label: string
  onPress: () => void
  // "primary" is filled with the accent; "secondary" is a bordered surface.
  variant?: "primary" | "secondary"
  icon?: ComponentProps<typeof Feather>["name"]
  // Used instead of `icon` for an icon from another set (e.g. a dumbbell);
  // the caller colours it to match the label.
  iconElement?: ReactNode
  // Puts the icon after the label (e.g. a forward arrow) instead of before it.
  iconAfter?: boolean
  disabled?: boolean
  // Shows a spinner in place of the icon. Callers usually also disable the
  // button and change its label while loading.
  loading?: boolean
}

// The app's button.
export function ThemedButton({
  palette,
  label,
  onPress,
  variant = "primary",
  icon,
  iconElement,
  iconAfter = false,
  disabled = false,
  loading = false,
}: ThemedButtonProps) {
  const isPrimary = variant === "primary"
  // A loading button can't be pressed but keeps its normal look, so it reads
  // as "working" rather than "unavailable".
  const looksDisabled = disabled && !loading
  const color = looksDisabled
    ? palette.textDisabled
    : isPrimary
      ? palette.onAccent
      : palette.text
  const iconNode = iconElement ?? (icon ? <Feather name={icon} size={18} color={color} /> : null)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: looksDisabled ? palette.surfaceRaised : palette.accent }
          : {
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            },
        pressed && !disabled && !loading && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : iconAfter ? null : iconNode}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {!loading && iconAfter ? iconNode : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
})
