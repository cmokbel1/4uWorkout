import { useMemo, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { fonts, radius, type Palette } from "../theme"
import type { WorkoutSet } from "../types/workout"
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

// The two inputs on each set row.
const SET_FIELDS = [
  { field: "weight", label: "WEIGHT (LBS)", name: "Weight", maxLength: 4 },
  { field: "reps", label: "REPS", name: "Reps", maxLength: 3 },
] as const

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

  function onChangeSetField(index: number, field: keyof SetForm, text: string): void {
    const digits = text.replace(/[^0-9]/g, "")
    setSetForms((prev) =>
      prev.map((form, i) => (i === index ? { ...form, [field]: digits } : form)),
    )
  }

  function onSave(): void {
    onConfirm(
      setForms.map((form) => ({
        weight: form.weight === "" ? undefined : Number(form.weight),
        reps: form.reps === "" ? undefined : Number(form.reps),
      })),
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Save workout</Text>
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
                        onChangeText={(text) => onChangeSetField(index, input.field, text)}
                        onFocus={() => {
                          focusedRow.current = index
                          scrollToFocusedRow()
                        }}
                        onBlur={() => {
                          if (focusedRow.current === index) focusedRow.current = null
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={palette.textDisabled}
                        maxLength={input.maxLength}
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
    modalTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 20,
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
