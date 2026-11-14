import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { useMemo, useRef, useState } from "react"
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
import { SavedViewSwitch } from "./SavedViewSwitch"
import { ScreenHeader } from "./ScreenHeader"
import { TextEntryModal } from "./TextEntryModal"
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
  // Switches the Saved tab to the calendar.
  onOpenCalendar: () => void
  // Shows today, from a past day.
  onOpenToday: () => void
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

// Space between the workout list's frame and the cards in it.
const LIST_PADDING = 8

// The day view of the Saved Workouts screen ("Today's workouts"), in the
// redesigned look: each saved workout as a card that expands to edit its sets.
export function DayView({
  isDark,
  onToggleDark,
  date,
  workouts,
  savedWorkouts,
  onOpenCalendar,
  onOpenToday,
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
  // Whether the workout list has more to scroll above or below what's shown,
  // for the fades at its frame's edges. Sizes and offset are refs so scrolling
  // only re-renders when an edge appears or goes.
  const listRef = useRef<ScrollView>(null)
  const listHeight = useRef(0)
  const listContentHeight = useRef(0)
  const listScrollY = useRef(0)
  const listOverflowed = useRef(false)
  const [listEdges, setListEdges] = useState({ above: false, below: false })

  function updateListEdges(): void {
    const above = listScrollY.current > 1
    const below = listContentHeight.current - listScrollY.current - listHeight.current > 1
    setListEdges((prev) => (prev.above === above && prev.below === below ? prev : { above, below }))
    // Flash the scroll bar when the list first runs past its frame, so it's
    // clear the list scrolls.
    const overflowed = listContentHeight.current > listHeight.current + 1
    if (overflowed && !listOverflowed.current) listRef.current?.flashScrollIndicators()
    listOverflowed.current = overflowed
  }

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
        onOpenMenu={() => setMenuVisible(true)}
      />

      <View style={styles.content}>
        <SavedViewSwitch
          palette={palette}
          value="day"
          onChange={(view) => {
            if (view === "calendar") onOpenCalendar()
          }}
        />

        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle} accessibilityRole="header">
            {formatDateLabel(date)}
          </Text>
          <View style={styles.dayHeaderEnd}>
            <Text style={styles.dayMeta}>
              {isToday ? `${formatShortDate(date)} · ${count}` : count}
            </Text>
            {/* The way back to today from a past day, now that the calendar
                has no "Today's workouts" card. */}
            {isToday ? null : (
              <Pressable
                onPress={onOpenToday}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="button"
                accessibilityLabel="Go to today"
              >
                <Text style={styles.todayLink}>Today</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Tinted and raised, so the actions don't read as more workout cards. */}
        <View style={styles.buttonRow}>
          <ThemedButton
            palette={palette}
            label="Add routine"
            icon="plus"
            variant="tonal"
            onPress={() => setRoutinesVisible(true)}
          />
          {workouts.length ? (
            <ThemedButton
              palette={palette}
              label={isRoutineSaved ? "Routine saved" : "Save as routine"}
              icon={isRoutineSaved ? "check" : "bookmark"}
              variant="tonal"
              disabled={isRoutineSaved}
              onPress={onPressSaveRoutine}
            />
          ) : null}
        </View>

        {/* Under the buttons, right above the list it describes. */}
        {workouts.length ? (
          <Text style={styles.helper}>Tap a workout to edit its sets and note.</Text>
        ) : null}

      </View>

      {workouts.length ? (
        // The list scrolls inside its own frame, which ends above the tab bar,
        // so the frame's edge shows where the list stops. A fade at the top or
        // bottom edge shows there's more to scroll.
        <View style={styles.listFrame}>
          <ScrollView
            ref={listRef}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onLayout={(event) => {
              listHeight.current = event.nativeEvent.layout.height
              updateListEdges()
            }}
            onContentSizeChange={(_, height) => {
              listContentHeight.current = height
              updateListEdges()
            }}
            onScroll={(event) => {
              listScrollY.current = event.nativeEvent.contentOffset.y
              updateListEdges()
            }}
          >
            {workouts.map((workout) => {
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
            })}
          </ScrollView>
          {listEdges.above ? (
            <View pointerEvents="none" style={[styles.listFade, styles.listFadeTop]} />
          ) : null}
          {listEdges.below ? (
            <View pointerEvents="none" style={[styles.listFade, styles.listFadeBottom]} />
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
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
        </View>
      )}

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
        links={[]}
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
    // The part above the workout list; it doesn't scroll.
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 16,
    },
    // Fills the rest of the screen above the tab bar. Its corners follow the
    // cards' inside its padding.
    listFrame: {
      flex: 1,
      marginHorizontal: 20 - LIST_PADDING,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: radius.lg + LIST_PADDING,
      backgroundColor: c.surfaceSunken,
      overflow: "hidden",
    },
    listContent: {
      padding: LIST_PADDING,
      gap: 12,
    },
    listFade: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 28,
    },
    listFadeTop: {
      top: 0,
      experimental_backgroundImage: `linear-gradient(to top, ${c.surfaceSunken}00, ${c.surfaceSunken})`,
    },
    listFadeBottom: {
      bottom: 0,
      experimental_backgroundImage: `linear-gradient(to bottom, ${c.surfaceSunken}00, ${c.surfaceSunken})`,
    },
    emptyWrap: {
      paddingHorizontal: 20,
    },
    pressed: {
      opacity: 0.75,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
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
    dayHeaderEnd: {
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 12,
    },
    dayMeta: {
      flexShrink: 1,
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
      textAlign: "right",
    },
    todayLink: {
      color: c.onAccentTint,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    helper: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      // Sits a little closer to the list it describes than to the buttons.
      marginBottom: -6,
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
