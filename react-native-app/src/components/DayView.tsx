import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { useMemo, useRef, useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { fonts, getPalette, GUTTER, radius, type Palette } from "../theme"
import { ROUTINE_NAME_MAX_LENGTH, type Routine } from "../types/routine"
import { NOTE_MAX_LENGTH, type Workout } from "../types/workout"
import type { TabParamList } from "../../App"
import { routineMatchesDay } from "../storage/routines"
import type { SavedWorkoutsByDate } from "../storage/savedWorkouts"
import { formatDateLabel, formatShortDate, todayKey } from "../utils/date"
import { AppMenu } from "./AppMenu"
import { KeyboardDoneBar } from "./KeyboardDoneBar"
import { RoutinesSheet } from "./RoutinesSheet"
import { SavedViewSwitch, type SavedView } from "./SavedViewSwitch"
import { ScreenHeader } from "./ScreenHeader"
import { ScrollFrame, type ScrollFrameHandle } from "./ScrollFrame"
import { TextEntryModal } from "./TextEntryModal"
import { ThemedButton } from "./ThemedButton"
import { WorkoutCard, type SetField } from "./WorkoutCard"

interface DayViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // The date shown (YYYY-MM-DD) and the workouts saved on it.
  date: string
  workouts: Workout[]
  // Every saved day, for the notes left on earlier days.
  savedWorkouts: SavedWorkoutsByDate
  // The Day | Calendar switch.
  onChangeView: (view: SavedView) => void
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

// The Done bar above the iOS keypad for the cards' reps and weight fields.
const KEYBOARD_DONE_BAR_ID = "day-view-set-entry"

// The day view of the Saved tab: the day's heading, routine actions, and its
// workouts in a scrolling frame, each a card that expands to edit its sets.
export function DayView({
  isDark,
  onToggleDark,
  date,
  workouts,
  savedWorkouts,
  onChangeView,
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

  // Whether a routine already holds exactly this day's exercises: saving would
  // add nothing, so "Save as routine" reads "Routine saved" and is disabled,
  // as Save reads "Saved" on Randomize.
  const isRoutineSaved = useMemo(
    () => routines.some((routine) => routineMatchesDay(routine, workouts)),
    [routines, workouts],
  )
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

  // Opening a card grows it, so it's scrolled fully into view once it has its
  // new size: onToggleExpanded notes which card is opening, and that card's
  // next onLayout (with the new height) asks the frame to reveal it.
  const frameRef = useRef<ScrollFrameHandle>(null)
  const revealOnLayout = useRef<string | null>(null)

  const isToday = date === todayKey()
  const countLabel = `${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`
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

      <SavedViewSwitch palette={palette} value="day" onChange={onChangeView} />

      {/* The part above the workout list; it doesn't scroll. */}
      <View style={styles.content}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle} accessibilityRole="header">
            {formatDateLabel(date)}
          </Text>
          <View style={styles.dayHeaderEnd}>
            <Text style={styles.dayMeta}>
              {isToday ? `${formatShortDate(date)} · ${countLabel}` : countLabel}
            </Text>
            {/* The quick way back to today from a past day. */}
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
        <ScrollFrame palette={palette} ref={frameRef}>
          {workouts.map((workout) => {
            const isExpanded = Boolean(expanded[workout.id])
            return (
              <WorkoutCard
                key={workout.id}
                palette={palette}
                workout={workout}
                date={date}
                savedWorkouts={savedWorkouts}
                expanded={isExpanded}
                onToggleExpanded={() => {
                  if (!isExpanded) revealOnLayout.current = workout.id
                  setExpanded((prev) => ({ ...prev, [workout.id]: !prev[workout.id] }))
                }}
                onLayout={(event) => {
                  if (revealOnLayout.current !== workout.id) return
                  revealOnLayout.current = null
                  const { y, height } = event.nativeEvent.layout
                  frameRef.current?.reveal(y, height)
                }}
                onOpen={() => onOpenWorkout(workout)}
                onDelete={() => onDelete(workout)}
                onChangeSet={(setIndex, field, value, save) =>
                  onChangeSet(workout.id, setIndex, field, value, save)
                }
                onSaveSets={onSaveSets}
                onEditNote={() => setNoteWorkout(workout)}
                keyboardDoneBarID={KEYBOARD_DONE_BAR_ID}
              />
            )
          })}
        </ScrollFrame>
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

      <KeyboardDoneBar palette={palette} nativeID={KEYBOARD_DONE_BAR_ID} />

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
        helper={`${countLabel}. Reps, weight and notes aren't saved with the routine.`}
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
    content: {
      paddingHorizontal: GUTTER,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 16,
    },
    emptyWrap: {
      paddingHorizontal: GUTTER,
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
