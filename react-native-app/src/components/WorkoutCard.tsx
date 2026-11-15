import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from "react-native"

import { notesForExercise, type SavedWorkoutsByDate } from "../storage/savedWorkouts"
import { fonts, radius, type Palette } from "../theme"
import { WEIGHT_DECIMALS, type Workout } from "../types/workout"
import { cleanNumberInput, parseNumberInput, roundTo } from "../utils/numberInput"
import { PreviousNotes } from "./PreviousNotes"

export type SetField = "reps" | "weight"

// The two stepper columns of each set row. Reps step by 1, weight by 5 lb;
// tapping the number lets you type any value: whole reps, and weights with up
// to WEIGHT_DECIMALS places (maxLength fits "9999.75").
const SET_COLUMNS = [
  { field: "reps", label: "Reps", step: 1, decimals: 0, maxLength: 3 },
  { field: "weight", label: "Weight (lb)", step: 5, decimals: WEIGHT_DECIMALS, maxLength: 7 },
] as const

interface WorkoutCardProps {
  palette: Palette
  workout: Workout
  // The day shown (YYYY-MM-DD) and every saved day, for the notes left on
  // earlier days.
  date: string
  savedWorkouts: SavedWorkoutsByDate
  expanded: boolean
  onToggleExpanded: () => void
  onOpen: () => void
  onDelete: () => void
  // Changes one set's reps or weight. `save` writes it to storage straight
  // away (stepper taps); typed values are saved by onSaveSets when editing ends.
  onChangeSet: (setIndex: number, field: SetField, value: number | undefined, save: boolean) => void
  onSaveSets: () => void
  onEditNote: () => void
  onLayout?: (event: LayoutChangeEvent) => void
  // The nativeID of the screen's KeyboardDoneBar, shown above the keypad on iOS.
  keyboardDoneBarID: string
}

// One saved workout on the day view: its name and set count (View, Delete),
// expanding into a Set / Reps / Weight table with − / + steppers and the
// day's note.
export function WorkoutCard({
  palette,
  workout,
  date,
  savedWorkouts,
  expanded,
  onToggleExpanded,
  onOpen,
  onDelete,
  onChangeSet,
  onSaveSets,
  onEditNote,
  onLayout,
  keyboardDoneBarID,
}: WorkoutCardProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const sets = workout.setDetails ?? []

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <Pressable
          onPress={onToggleExpanded}
          style={styles.titlePress}
          accessibilityRole="button"
          // The note icon below sits inside this button, so the label carries
          // it for screen readers.
          accessibilityLabel={`${expanded ? "Collapse" : "Expand"} ${workout.name}${
            workout.note ? ", has a note" : ""
          }`}
          accessibilityState={{ expanded }}
        >
          <Feather
            name={expanded ? "chevron-down" : "chevron-right"}
            size={18}
            color={palette.textMuted}
          />
          <View style={styles.titleText}>
            <Text style={styles.title} numberOfLines={2}>
              {workout.name}
            </Text>
            <View style={styles.subRow}>
              <Text style={styles.sub}>
                {sets.length} {sets.length === 1 ? "set" : "sets"}
              </Text>
              {workout.note ? (
                <Feather name="file-text" size={13} color={palette.textMuted} />
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable
          onPress={onOpen}
          style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`View ${workout.name}`}
        >
          <Text style={styles.viewText}>View</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${workout.name}`}
        >
          <Feather name="trash-2" size={18} color={palette.danger} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.setsTable}>
          <View style={styles.setsRow}>
            <Text style={[styles.setsHeaderText, styles.setCol]}>Set</Text>
            {SET_COLUMNS.map((column) => (
              <Text key={column.field} style={[styles.setsHeaderText, styles.stepperCol]}>
                {column.label}
              </Text>
            ))}
          </View>
          {sets.map((set, index) => (
            <View key={index} style={styles.setsRow}>
              <View style={styles.setCol}>
                <View style={styles.setNumber}>
                  <Text style={styles.setNumberText}>{index + 1}</Text>
                </View>
              </View>
              {SET_COLUMNS.map((column) => {
                const value = set[column.field]
                const what = `${column.label.toLowerCase()} for set ${index + 1}`
                return (
                  <View key={column.field} style={[styles.stepper, styles.stepperCol]}>
                    <Pressable
                      onPress={() =>
                        onChangeSet(
                          index,
                          column.field,
                          Math.max(roundTo((value ?? 0) - column.step, column.decimals), 0),
                          true,
                        )
                      }
                      style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease ${what}`}
                    >
                      <Feather name="minus" size={16} color={palette.text} />
                    </Pressable>
                    <SetValueInput
                      style={styles.stepperValue}
                      placeholderColor={palette.textDisabled}
                      value={value}
                      decimals={column.decimals}
                      maxLength={column.maxLength}
                      keyboardDoneBarID={keyboardDoneBarID}
                      accessibilityLabel={`${column.label} for set ${index + 1} of ${workout.name}`}
                      onChange={(next) => onChangeSet(index, column.field, next, false)}
                      onEndEditing={onSaveSets}
                    />
                    <Pressable
                      onPress={() =>
                        onChangeSet(
                          index,
                          column.field,
                          roundTo((value ?? 0) + column.step, column.decimals),
                          true,
                        )
                      }
                      style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase ${what}`}
                    >
                      <Feather name="plus" size={16} color={palette.text} />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          ))}
          <Pressable
            onPress={onEditNote}
            style={({ pressed }) => [styles.noteRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={
              workout.note
                ? `Edit note for ${workout.name}: ${workout.note}`
                : `Add a note for ${workout.name}`
            }
          >
            <Text style={workout.note ? styles.noteText : styles.notePlaceholder}>
              {workout.note ?? "Add a note"}
            </Text>
            <Feather name="edit-2" size={15} color={palette.textMuted} />
          </Pressable>
          {/* Until this day has its own note, show the last one. */}
          {workout.note ? null : (
            <PreviousNotes
              palette={palette}
              notes={notesForExercise(savedWorkouts, workout.id, date)}
            />
          )}
        </View>
      ) : null}
    </View>
  )
}

interface SetValueInputProps {
  style: StyleProp<TextStyle>
  placeholderColor: string
  value: number | undefined
  decimals: number
  maxLength: number
  keyboardDoneBarID: string
  accessibilityLabel: string
  onChange: (value: number | undefined) => void
  onEndEditing: () => void
}

// A set's reps or weight between its − and + buttons. While it's typed in, it
// shows the text as typed, so a weight can pass through "22." or "22.50"
// without snapping to "22" or "22.5" (the saved number drops them). Once the
// typed text no longer matches the saved number (a stepper changed it, or
// editing ended), it shows the number again.
function SetValueInput({
  style,
  placeholderColor,
  value,
  decimals,
  maxLength,
  keyboardDoneBarID,
  accessibilityLabel,
  onChange,
  onEndEditing,
}: SetValueInputProps) {
  const [typed, setTyped] = useState<string | null>(null)
  const shown =
    typed !== null && parseNumberInput(typed) === value ? typed : value != null ? String(value) : ""

  return (
    <TextInput
      style={style}
      value={shown}
      onChangeText={(text) => {
        const clean = cleanNumberInput(text, decimals)
        setTyped(clean)
        onChange(parseNumberInput(clean))
      }}
      onEndEditing={() => {
        setTyped(null)
        onEndEditing()
      }}
      keyboardType={decimals ? "decimal-pad" : "number-pad"}
      returnKeyType="done"
      inputAccessoryViewID={keyboardDoneBarID}
      placeholder="0"
      placeholderTextColor={placeholderColor}
      maxLength={maxLength}
      accessibilityLabel={accessibilityLabel}
    />
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.75,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
    },
    titlePress: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
    },
    titleText: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      textTransform: "capitalize",
    },
    subRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sub: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    viewButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 16,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceRaised,
    },
    viewText: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    deleteButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    setsTable: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      padding: 14,
      gap: 10,
    },
    setsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    setsHeaderText: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
      textAlign: "center",
    },
    setCol: {
      width: 32,
      alignItems: "center",
    },
    stepperCol: {
      flex: 1,
    },
    setNumber: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    setNumberText: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceRaised,
    },
    stepperButton: {
      width: 36,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperValue: {
      flex: 1,
      padding: 0,
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      textAlign: "center",
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceSunken,
    },
    noteText: {
      flex: 1,
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
    },
    notePlaceholder: {
      flex: 1,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
    },
  })
}
