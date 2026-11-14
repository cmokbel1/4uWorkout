import { Feather } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native"

import { fonts, radius, type Palette } from "../theme"

interface ThemedButtonProps {
  palette: Palette
  label: string
  onPress: () => void
  // "primary" is filled with the accent; "secondary" is a bordered surface.
  // "action" (filled) and "actionOutline" (accent outline) are for Find and
  // Save workout on Training's bottom bar; disabled, they fade instead of turning grey, so they still
  // read as those buttons. "tonal" is an accent-tinted fill with a soft shadow,
  // for actions that sit next to white cards (the day view's
  // routine buttons); it fades when disabled too.
  variant?: "primary" | "secondary" | "action" | "actionOutline" | "tonal"
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
  const isAction = variant === "action" || variant === "actionOutline"
  const isTonal = variant === "tonal"
  // A loading button can't be pressed but keeps its normal look, so it reads
  // as "working" rather than "unavailable".
  const looksDisabled = disabled && !loading
  const color =
    variant === "action"
      ? palette.onAccent
      : variant === "actionOutline"
        ? palette.accent
        : isTonal
          ? palette.onAccentTint
          : looksDisabled
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
        variant === "action"
          ? { backgroundColor: palette.accent }
          : variant === "actionOutline"
            ? [styles.outline, { borderColor: palette.accent }]
            : isTonal
              ? [styles.raised, { backgroundColor: palette.accentTint }]
              : isPrimary
              ? { backgroundColor: looksDisabled ? palette.surfaceRaised : palette.accent }
              : {
                  backgroundColor: palette.surface,
                  borderWidth: 1,
                  borderColor: palette.border,
                },
        (isAction || isTonal) && looksDisabled && styles.faded,
        pressed && !disabled && !loading && styles.pressed,
        pressed && isTonal && styles.pressedFlat,
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
  // Transparent, so it shows the surface it sits on.
  outline: {
    borderWidth: 1.5,
  },
  // A soft shadow. shadow* is iOS; Android uses boxShadow, which (unlike
  // elevation) is only drawn outside the button.
  raised: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    android: {
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.12)",
    },
    default: {},
  }),
  // The shadow drops while pressed, so the button looks pushed in.
  pressedFlat: {
    shadowOpacity: 0,
    boxShadow: [],
  },
  faded: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
})
