import { useMemo } from "react"
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, GUTTER, type Palette } from "../theme"

interface KeyboardDoneBarProps {
  palette: Palette
  // Matches the inputAccessoryViewID of the fields that show the bar. Each
  // screen uses its own, since tab screens stay mounted side by side.
  nativeID: string
}

// iOS's number and decimal keypads have no return key, so the reps and weight
// fields get this bar above the keypad: Done closes the keyboard, which ends
// editing (and so saves a typed value). Renders nothing on Android, whose
// keypads have their own Done key. Render one per screen (or dialog).
export function KeyboardDoneBar({ palette, nativeID }: KeyboardDoneBarProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  if (Platform.OS !== "ios") return null

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={8}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={styles.label}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: GUTTER,
      paddingVertical: 6,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    button: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    pressed: {
      opacity: 0.6,
    },
    label: {
      color: c.onAccentTint,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
  })
}
