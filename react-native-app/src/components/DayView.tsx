import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { fonts, getPalette, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { formatDateLabel, formatShortDate, todayKey } from "../utils/date"
import { AppMenu } from "./AppMenu"
import { ScreenHeader } from "./ScreenHeader"
import { ThemedButton } from "./ThemedButton"

export type SetField = "reps" | "weight"

interface DayViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // The date shown (YYYY-MM-DD) and the workouts saved on it.
  date: string
  workouts: Workout[]
  onBack: () => void
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
  onBack,
  onOpenCalendar,
  onOpenWorkout,
  onDelete,
  onChangeSet,
  onSaveSets,
}: DayViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [menuVisible, setMenuVisible] = useState(false)
  // Which workout cards are expanded to show their sets. Collapsed by default.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const isToday = date === todayKey()
  const count = `${workouts.length} ${workouts.length === 1 ? "workout" : "workouts"}`
  const openTraining = () => navigation.navigate("Training")

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
          <ThemedButton
            palette={palette}
            label="Training"
            iconElement={
              <MaterialCommunityIcons name="dumbbell" size={18} color={palette.onAccent} />
            }
            onPress={openTraining}
          />
          <ThemedButton
            palette={palette}
            label="View Calendar"
            icon="calendar"
            variant="secondary"
            onPress={onOpenCalendar}
          />
        </View>

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
            <Text style={styles.helper}>Tap a workout to view and edit its sets.</Text>
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
                    accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${workout.name}`}
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
                      <Text style={styles.cardSub}>
                        {sets.length} {sets.length === 1 ? "set" : "sets"}
                      </Text>
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
                ? "Find a workout on Training and save it to see it here."
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

      <AppMenu
        palette={palette}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        links={[
          { title: "Training", subtitle: "Find a workout", icon: "shuffle", onPress: openTraining },
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
