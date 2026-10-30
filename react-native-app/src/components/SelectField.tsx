import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fonts, radius, type Palette } from "../theme"

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  palette: Palette
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  // Heading of the choice sheet, and the field's accessibility label.
  title: string
  // "large" shows just the value in big type (body part); "compact" shows a
  // small caps label above the value (target, equipment).
  size?: "large" | "compact"
  disabled?: boolean
}

// A dropdown-style field. Tapping it opens a bottom sheet listing the options;
// picking one closes the sheet.
export function SelectField({
  palette,
  options,
  value,
  onChange,
  title,
  size = "large",
  disabled = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(palette), [palette])
  const selected = options.find((option) => option.value === value)

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          size === "large" ? styles.fieldLarge : styles.fieldCompact,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${selected?.label ?? "none"}`}
        accessibilityHint="Opens a list of choices"
        accessibilityState={{ disabled }}
      >
        <View style={styles.fieldText}>
          {size === "compact" ? (
            <Text style={styles.compactLabel}>{title.toUpperCase()}</Text>
          ) : null}
          <Text
            style={size === "large" ? styles.valueLarge : styles.valueCompact}
            numberOfLines={1}
          >
            {selected?.label ?? ""}
          </Text>
        </View>
        <Feather
          name="chevron-down"
          size={size === "large" ? 20 : 18}
          color={size === "large" ? palette.accent : palette.text}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(false)}
          accessibilityLabel="Close"
        >
          {/* Inner Pressable stops taps on the sheet from closing it. */}
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={() => {}}
          >
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <ScrollView style={styles.sheetList}>
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[styles.optionText, isSelected && styles.optionTextSelected]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Feather name="check" size={18} color={palette.accent} />
                    ) : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    field: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      backgroundColor: c.surfaceSunken,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    fieldLarge: {
      borderRadius: radius.md,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    fieldCompact: {
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    fieldText: {
      flex: 1,
      gap: 2,
    },
    compactLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    valueLarge: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 20,
      textTransform: "capitalize",
    },
    valueCompact: {
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.5,
    },
    scrim: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingTop: 10,
      maxHeight: "70%",
      gap: 8,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: c.borderStrong,
      marginBottom: 6,
    },
    sheetTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
      paddingHorizontal: 4,
      paddingBottom: 4,
    },
    sheetList: {
      flexGrow: 0,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: radius.sm,
    },
    optionSelected: {
      backgroundColor: c.surfaceSunken,
    },
    optionText: {
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: 16,
    },
    optionTextSelected: {
      fontFamily: fonts.bold,
      color: c.accent,
    },
  })
}
