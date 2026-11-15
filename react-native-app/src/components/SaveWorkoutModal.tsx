import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useMemo, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { fonts, radius, type Palette } from "../theme"
import type { WorkoutSet } from "../types/workout"
import {
  cleanNumberInput,
  maxLengthFor,
  parseNumberInput,
  SET_INPUT_RULES,
  type NumberRules,
} from "../utils/numberInput"
import { KeyboardDoneBar } from "./KeyboardDoneBar"
import { SelectField, type SelectOption } from "./SelectField"
import { ThemedButton } from "./ThemedButton"

interface SaveWorkoutModalProps {
  palette: Palette
  visible: boolean
  // Shown under the title; omitted when there's no workout.
  workoutName?: string
  onCancel: () => void
  // The sets entered, one per set; blank fields are undefined.
  onConfirm: (setDetails: WorkoutSet[]) => void
}

const SET_COUNT_OPTIONS: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

// The two inputs on each set row, typed by SET_INPUT_RULES (weights with 2
// decimal places, whole reps).
const SET_FIELDS = [
  { field: "weight", label: "WEIGHT (LBS)", name: "Weight", rules: SET_INPUT_RULES.weight },
  { field: "reps", label: "REPS", name: "Reps", rules: SET_INPUT_RULES.reps },
] as const

// The Done bar above the iOS keypad. The dialog has its own window, so it has
// its own bar rather than sharing a screen's.
const KEYBOARD_DONE_BAR_ID = "save-dialog-set-entry"

// One {weight, reps} form per set, held as strings for controlled inputs.
type SetForm = { weight: string; reps: string }
const EMPTY_SET: SetForm = { weight: "", reps: "" }

// The Training screen's save dialog: a set count, then optional weight and
// reps for each set.
export function SaveWorkoutModal({
  palette,
  visible,
  workoutName,
  onCancel,
  onConfirm,
}: SaveWorkoutModalProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [setForms, setSetForms] = useState<SetForm[]>([EMPTY_SET])

  // The set being typed in is scrolled to the top of the list, so the
  // keyboard can't cover it: when its input is focused, and again when the
  // list shrinks as the keyboard opens (the dialog sits in a
  // KeyboardAvoidingView, so it resizes to the space above the keyboard).
  const scrollRef = useRef<ScrollView>(null)
  const rowY = useRef<number[]>([])
  const focusedRow = useRef<number | null>(null)

  function scrollToFocusedRow(): void {
    if (focusedRow.current === null) return
    scrollRef.current?.scrollTo({ y: rowY.current[focusedRow.current] ?? 0, animated: true })
  }

  // Start from one blank set each time the dialog opens. Done while rendering
  // (not in an effect) so the old values never show for a frame.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setSetForms([EMPTY_SET])
  }

  // Resize the per-set forms to match the chosen count, preserving any values
  // already entered for sets that survive the resize.
  function onChangeSetCount(count: number): void {
    setSetForms((prev) => {
      if (count <= prev.length) return prev.slice(0, count)
      const grown = [...prev]
      while (grown.length < count) grown.push(EMPTY_SET)
      return grown
    })
  }

  function onChangeSetField(
    index: number,
    field: keyof SetForm,
    text: string,
    rules: NumberRules,
  ): void {
    const clean = cleanNumberInput(text, rules)
    setSetForms((prev) =>
      prev.map((form, i) => (i === index ? { ...form, [field]: clean } : form)),
    )
  }

  function onSave(): void {
    onConfirm(
      setForms.map((form) => ({
        weight: parseNumberInput(form.weight),
        reps: parseNumberInput(form.reps),
      })),
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Save workout</Text>
            {/* Always reachable, even when the keyboard covers Cancel. */}
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onCancel}
              hitSlop={8}
              accessibilityLabel="Close without saving"
              accessibilityRole="button"
            >
              {/* Feather only has a thin X; this one is bold. */}
              <MaterialCommunityIcons name="close-thick" size={20} color={palette.text} />
            </Pressable>
          </View>
          {workoutName ? <Text style={styles.modalSubtitle}>{workoutName}</Text> : null}
          <Text style={styles.helperText}>
            Weight and reps are optional — you can edit them later.
          </Text>
          <SelectField
            palette={palette}
            size="compact"
            title="Sets"
            options={SET_COUNT_OPTIONS}
            value={String(setForms.length)}
            onChange={(value) => onChangeSetCount(Number(value))}
          />
          <ScrollView
            ref={scrollRef}
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            onLayout={scrollToFocusedRow}
          >
            {setForms.map((form, index) => (
              <View
                key={index}
                style={styles.setRow}
                onLayout={(event) => {
                  rowY.current[index] = event.nativeEvent.layout.y
                }}
              >
                <Text style={styles.setRowLabel}>Set {index + 1}</Text>
                <View style={styles.inputRow}>
                  {SET_FIELDS.map((input) => (
                    <View key={input.field} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{input.label}</Text>
                      <TextInput
                        style={styles.numberInput}
                        value={form[input.field]}
                        onChangeText={(text) =>
                          onChangeSetField(index, input.field, text, input.rules)
                        }
                        onFocus={() => {
                          focusedRow.current = index
                          scrollToFocusedRow()
                        }}
                        onBlur={() => {
                          if (focusedRow.current === index) focusedRow.current = null
                        }}
                        keyboardType={input.rules.decimals ? "decimal-pad" : "number-pad"}
                        returnKeyType="done"
                        inputAccessoryViewID={KEYBOARD_DONE_BAR_ID}
                        placeholder="0"
                        placeholderTextColor={palette.textDisabled}
                        maxLength={maxLengthFor(input.rules)}
                        accessibilityLabel={`${input.name} for set ${index + 1}`}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalActions}>
            <ThemedButton palette={palette} label="Cancel" variant="secondary" onPress={onCancel} />
            <ThemedButton palette={palette} label="Save" icon="check" onPress={onSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
      <KeyboardDoneBar palette={palette} nativeID={KEYBOARD_DONE_BAR_ID} />
    </Modal>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      maxHeight: "80%",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 20,
      gap: 14,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 20,
    },
    // Same round button as the Instructions dialog's speaker.
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.75,
    },
    modalSubtitle: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 15,
      textTransform: "capitalize",
    },
    helperText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    modalBody: {
      flexShrink: 1,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
    },
    setRow: {
      gap: 8,
      marginBottom: 14,
    },
    setRowLabel: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    inputRow: {
      flexDirection: "row",
      gap: 12,
    },
    inputGroup: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    numberInput: {
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSunken,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
    },
  })
}
