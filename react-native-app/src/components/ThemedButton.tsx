import { Feather } from "@expo/vector-icons"
import type { ComponentProps, ReactNode } from "react"
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { fonts, radius, type Palette } from "../theme"

type Variant = "primary" | "secondary" | "action" | "actionOutline" | "tonal"

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
  variant?: Variant
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
  // A loading button can't be pressed but keeps its normal look, so it reads
  // as "working" rather than "unavailable".
  const looksDisabled = disabled && !loading
  const { color, background, fadesWhenDisabled } = variantLook(variant, palette, looksDisabled)
  const iconNode = iconElement ?? (icon ? <Feather name={icon} size={18} color={color} /> : null)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        background,
        fadesWhenDisabled && looksDisabled && styles.faded,
        pressed && !disabled && !loading && styles.pressed,
        pressed && variant === "tonal" && styles.pressedFlat,
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

// How each variant looks: its label and icon colour, its background, and
// whether it fades when disabled (rather than turning grey, so it still reads
// as that button).
function variantLook(
  variant: Variant,
  palette: Palette,
  looksDisabled: boolean,
): { color: string; background: StyleProp<ViewStyle>; fadesWhenDisabled: boolean } {
  switch (variant) {
    case "action":
      return {
        color: palette.onAccent,
        background: { backgroundColor: palette.accent },
        fadesWhenDisabled: true,
      }
    case "actionOutline":
      return {
        color: palette.accent,
        background: [styles.outline, { borderColor: palette.accent }],
        fadesWhenDisabled: true,
      }
    case "tonal":
      return {
        color: palette.onAccentTint,
        background: [styles.raised, { backgroundColor: palette.accentTint }],
        fadesWhenDisabled: true,
      }
    case "primary":
      return {
        color: looksDisabled ? palette.textDisabled : palette.onAccent,
        background: { backgroundColor: looksDisabled ? palette.surfaceRaised : palette.accent },
        fadesWhenDisabled: false,
      }
    case "secondary":
      return {
        color: looksDisabled ? palette.textDisabled : palette.text,
        background: {
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        },
        fadesWhenDisabled: false,
      }
  }
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
