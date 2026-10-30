import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"
import { BottomSheet } from "./BottomSheet"

export interface SelectOption {
  value: string
  label: string
  // Secondary text on the right of the option row, e.g. a count.
  detail?: string
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

      <BottomSheet
        palette={palette}
        visible={open}
        onClose={() => setOpen(false)}
        title={title}
      >
        <ScrollView style={styles.list}>
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
                accessibilityLabel={
                  option.detail ? `${option.label}, ${option.detail}` : option.label
                }
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                <View style={styles.optionEnd}>
                  {option.detail ? (
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  ) : null}
                  {isSelected ? (
                    <Feather name="check" size={18} color={palette.accent} />
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </ScrollView>
      </BottomSheet>
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
    list: {
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
    optionEnd: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    optionDetail: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
  })
}
