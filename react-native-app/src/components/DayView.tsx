import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { fonts, getPalette, radius, type Palette } from "../theme"
import { ROUTINE_NAME_MAX_LENGTH, type Routine } from "../types/routine"
import { NOTE_MAX_LENGTH, type Workout } from "../types/workout"
import type { TabParamList } from "../../App"
import { routineMatchesDay } from "../storage/routines"
import { notesForExercise, type SavedWorkoutsByDate } from "../storage/savedWorkouts"
import { formatDateLabel, formatShortDate, todayKey } from "../utils/date"
import { AppMenu } from "./AppMenu"
import { PreviousNotes } from "./PreviousNotes"
import { RoutinesSheet } from "./RoutinesSheet"
import { ScreenHeader } from "./ScreenHeader"
import { TextEntryModal } from "./TextEntryModal"
import { NavCard } from "./NavCard"
import { ThemedButton } from "./ThemedButton"

export type SetField = "reps" | "weight"

interface DayViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // The date shown (YYYY-MM-DD) and the workouts saved on it.
  date: string
  workouts: Workout[]
  // Every saved day, for the notes left on earlier days.
  savedWorkouts: SavedWorkoutsByDate
  // Back to the previous view (the calendar); absent when there's none.
  onBack?: () => void
  onOpenCalendar: () => void
  onOpenWorkout: (workout: Workout) => void
  onDelete: (workout: Workout) => void
  // Changes one set's reps or weight. `save` writes it to storage straight
  // away (stepper taps); typed values are saved by onSaveSets when editing ends.
  onChangeSet: (
    workoutId: string,
    setIndex: number,
    field: SetField,
    value: number | undefined,
    save: boolean,
  ) => void
  onSaveSets: () => void
  // Sets or clears (undefined) a workout's note, saving it straight away.
  onChangeNote: (workoutId: string, note: string | undefined) => void
  routines: Routine[]
  // Saves this day's workouts as a new routine.
  onSaveRoutine: (name: string) => void
  // Replaces a routine's exercises with this day's workouts.
  onOverwriteRoutine: (routine: Routine) => void
  onAddRoutine: (routine: Routine) => void
  onDeleteRoutine: (routine: Routine) => void
}

// The two stepper columns of each set row. Reps step by 1, weight by 5 lb;
// tapping the number lets you type any value.
const SET_COLUMNS = [
  { field: "reps", label: "Reps", step: 1, maxLength: 3 },
  { field: "weight", label: "Weight (lb)", step: 5, maxLength: 4 },
] as const

// The day view of the Saved Workouts screen ("Today's workouts"), in the
// redesigned look: each saved workout as a card that expands to edit its sets.
export function DayView({
  isDark,
  onToggleDark,
  date,
  workouts,
  savedWorkouts,
  onBack,
  onOpenCalendar,
  onOpenWorkout,
  onDelete,
  onChangeSet,
  onSaveSets,
  onChangeNote,
  routines,
  onSaveRoutine,
  onOverwriteRoutine,
  onAddRoutine,
  onDeleteRoutine,
}: DayViewProps) {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>()
  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [menuVisible, setMenuVisible] = useState(false)
  // Which workout cards are expanded to show their sets. Collapsed by default.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // The workout whose note is open in the note dialog.
  const [noteWorkout, setNoteWorkout] = useState<Workout | null>(null)
  const [routineNameVisible, setRoutineNameVisible] = useState(false)
  const [routinesVisible, setRoutinesVisible] = useState(false)
  // A routine that already holds exactly this day's exercises: saving would
  // add nothing, so "Save as routine" reads "Routine saved" and is disabled,
  // as Save reads "Saved" on Randomize.
  const isRoutineSaved = routines.some((routine) => routineMatchesDay(routine, workouts))
  // The routine this day was saved as or added from (if it still exists),
  // which Save offers to update once the day's exercises differ from it. With
  // several, the one most of the day's workouts came from.
  const linkedRoutine = useMemo(() => {
    let best: Routine | undefined
    let bestCount = 0
    for (const routine of routines) {
      const count = workouts.filter((w) => w.routineId === routine.id).length
      if (count > bestCount) {
        best = routine
        bestCount = count
      }
    }
    return best
  }, [routines, workouts])
  const dayWorkoutIds = useMemo(() => new Set(workouts.map((w) => w.id)), [workouts])

  const isToday = date === todayKey()
  const count = `${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`
  const openTraining = () => navigation.navigate("Training")

  // A day linked to a routine asks whether to update it or save a new one;
  // otherwise Save goes straight to naming the new routine.
  function onPressSaveRoutine(): void {
    if (!linkedRoutine) {
      setRoutineNameVisible(true)
      return
    }
    Alert.alert(
      "Save routine",
      `This day differs from "${linkedRoutine.name}" routine. Update "${linkedRoutine.name}" to match it, or save it as a new routine?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save as new", onPress: () => setRoutineNameVisible(true) },
        { text: "Update", onPress: () => onOverwriteRoutine(linkedRoutine) },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader
        palette={palette}
        title="Trainer"
        onBack={onBack}
        onOpenMenu={() => setMenuVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.buttonRow}>
          <NavCard
            palette={palette}
            icon="calendar"
            title="Calendar"
            subtitle="Schedule"
            onPress={onOpenCalendar}
          />
        </View>
        {/* Sets the card off from the content, as on the Calendar. */}
        <View style={styles.divider} />

        <View>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle} accessibilityRole="header">
              {formatDateLabel(date)}
            </Text>
            <Text style={styles.dayMeta}>
              {isToday ? `${formatShortDate(date)} · ${count}` : count}
            </Text>
          </View>
          {workouts.length ? (
            <Text style={styles.helper}>Tap a workout to edit its sets and note.</Text>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <ThemedButton
            palette={palette}
            label="Add routine"
            icon="plus"
            variant="secondary"
            onPress={() => setRoutinesVisible(true)}
          />
          {workouts.length ? (
            <ThemedButton
              palette={palette}
              label={isRoutineSaved ? "Routine saved" : "Save as routine"}
              icon={isRoutineSaved ? "check" : "bookmark"}
              variant="secondary"
              disabled={isRoutineSaved}
              onPress={onPressSaveRoutine}
            />
          ) : null}
        </View>

        {workouts.length ? (
          workouts.map((workout) => {
            const isExpanded = Boolean(expanded[workout.id])
            const sets = workout.setDetails ?? []
            return (
              <View key={workout.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Pressable
                    onPress={() =>
                      setExpanded((prev) => ({ ...prev, [workout.id]: !prev[workout.id] }))
                    }
                    style={styles.cardTitlePress}
                    accessibilityRole="button"
                    // The note icon below sits inside this button, so the
                    // label carries it for screen readers.
                    accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${workout.name}${
                      workout.note ? ", has a note" : ""
                    }`}
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <Feather
                      name={isExpanded ? "chevron-down" : "chevron-right"}
                      size={18}
                      color={palette.textMuted}
                    />
                    <View style={styles.cardTitleText}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {workout.name}
                      </Text>
                      <View style={styles.cardSubRow}>
                        <Text style={styles.cardSub}>
                          {sets.length} {sets.length === 1 ? "set" : "sets"}
                        </Text>
                        {workout.note ? (
                          <Feather name="file-text" size={13} color={palette.textMuted} />
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => onOpenWorkout(workout)}
                    style={({ pressed }) => [styles.viewButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${workout.name}`}
                  >
                    <Text style={styles.viewText}>View</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(workout)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${workout.name}`}
                  >
                    <Feather name="trash-2" size={18} color={palette.danger} />
                  </Pressable>
                </View>

                {isExpanded ? (
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
                                    workout.id,
                                    index,
                                    column.field,
                                    Math.max((value ?? 0) - column.step, 0),
                                    true,
                                  )
                                }
                                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                                accessibilityRole="button"
                                accessibilityLabel={`Decrease ${what}`}
                              >
                                <Feather name="minus" size={16} color={palette.text} />
                              </Pressable>
                              <TextInput
                                style={styles.stepperValue}
                                value={value != null ? String(value) : ""}
                                onChangeText={(text) => {
                                  const digits = text.replace(/[^0-9]/g, "")
                                  onChangeSet(
                                    workout.id,
                                    index,
                                    column.field,
                                    digits === "" ? undefined : Number(digits),
                                    false,
                                  )
                                }}
                                onEndEditing={onSaveSets}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={palette.textDisabled}
                                maxLength={column.maxLength}
                                accessibilityLabel={`${column.label} for set ${index + 1} of ${workout.name}`}
                              />
                              <Pressable
                                onPress={() =>
                                  onChangeSet(
                                    workout.id,
                                    index,
                                    column.field,
                                    (value ?? 0) + column.step,
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
                      onPress={() => setNoteWorkout(workout)}
                      style={({ pressed }) => [styles.noteRow, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        workout.note
                          ? `Edit note for ${workout.name}: ${workout.note}`
                          : `Add a note for ${workout.name}`
                      }
                    >
                      <Text
                        style={workout.note ? styles.noteText : styles.notePlaceholder}
                      >
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
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No workouts saved for this day</Text>
            <Text style={styles.emptyText}>
              {isToday
                ? "Generate a workout on Randomize and save it to see it here."
                : "Pick another day on the calendar."}
            </Text>
            {/* Workouts are always saved for today, so finding one only helps
                when today is shown. */}
            {isToday ? (
              <View style={styles.emptyAction}>
                <ThemedButton
                  palette={palette}
                  label="Find a workout"
                  icon="shuffle"
                  onPress={openTraining}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <TextEntryModal
        palette={palette}
        visible={noteWorkout !== null}
        title="Note"
        subtitle={noteWorkout?.name ?? ""}
        initialValue={noteWorkout?.note}
        placeholder="e.g. Used the cable machine, left shoulder tight"
        maxLength={NOTE_MAX_LENGTH}
        multiline
        accessibilityLabel={`Note for ${noteWorkout?.name ?? ""}`}
        onCancel={() => setNoteWorkout(null)}
        onSave={(note) => {
          if (noteWorkout) onChangeNote(noteWorkout.id, note)
          setNoteWorkout(null)
        }}
      />

      <TextEntryModal
        palette={palette}
        visible={routineNameVisible}
        title="Save as routine"
        helper={`${count}. Reps, weight and notes aren't saved with the routine.`}
        placeholder="e.g. Push day"
        maxLength={ROUTINE_NAME_MAX_LENGTH}
        required
        accessibilityLabel="Routine name"
        onCancel={() => setRoutineNameVisible(false)}
        onSave={(name) => {
          setRoutineNameVisible(false)
          if (name) onSaveRoutine(name)
        }}
      />

      <RoutinesSheet
        palette={palette}
        visible={routinesVisible}
        onClose={() => setRoutinesVisible(false)}
        routines={routines}
        dayWorkoutIds={dayWorkoutIds}
        onPick={(routine) => {
          setRoutinesVisible(false)
          onAddRoutine(routine)
        }}
        onDelete={onDeleteRoutine}
      />

      <AppMenu
        palette={palette}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        links={[
          { title: "Calendar", subtitle: "Schedule", icon: "calendar", onPress: onOpenCalendar },
        ]}
        isDark={isDark}
        onToggleDark={onToggleDark}
      />
    </SafeAreaView>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 16,
    },
    pressed: {
      opacity: 0.75,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
    },
    // Full width (past the content's padding), matching ScreenHeader's divider.
    divider: {
      height: 1,
      marginHorizontal: -20,
      backgroundColor: c.border,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 12,
    },
    dayTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 26,
    },
    dayMeta: {
      flexShrink: 1,
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
      textAlign: "right",
    },
    helper: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      marginTop: 6,
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
    },
    cardTitlePress: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 44,
    },
    cardTitleText: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      textTransform: "capitalize",
    },
    cardSubRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cardSub: {
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
    emptyCard: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: c.borderStrong,
      borderRadius: radius.lg,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 10,
    },
    emptyTitle: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      textAlign: "center",
    },
    emptyText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    emptyAction: {
      flexDirection: "row",
      marginTop: 4,
    },
  })
}
