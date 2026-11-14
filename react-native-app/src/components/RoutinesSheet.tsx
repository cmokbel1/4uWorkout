import { Feather } from "@expo/vector-icons"
import { useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { fonts, type Palette } from "../theme"
import type { Routine } from "../types/routine"
import { BottomSheet } from "./BottomSheet"

interface RoutinesSheetProps {
  palette: Palette
  visible: boolean
  onClose: () => void
  routines: Routine[]
  // Ids of the workouts already on the day, which a routine won't add again.
  dayWorkoutIds: Set<string>
  onPick: (routine: Routine) => void
  onDelete: (routine: Routine) => void
}

// The day view's "Add routine" sheet: every saved routine, each with a delete
// button. A routine whose exercises are all on the day already can't be
// picked; one with some there says how many it will skip.
export function RoutinesSheet({
  palette,
  visible,
  onClose,
  routines,
  dayWorkoutIds,
  onPick,
  onDelete,
}: RoutinesSheetProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <BottomSheet palette={palette} visible={visible} onClose={onClose} title="Add a routine">
      {routines.length ? (
        <>
          <Text style={styles.hint}>Adds its exercises with blank sets to fill in.</Text>
          <ScrollView style={styles.list}>
            {routines.map((routine) => {
              const total = routine.exercises.length
              const already = routine.exercises.filter((ex) => dayWorkoutIds.has(ex.id)).length
              const allThere = already === total
              const meta = allThere
                ? "Already on this day"
                : `${total} ${total === 1 ? "exercise" : "exercises"}${
                    already ? ` · ${already} already on this day` : ""
                  }`
              return (
                <View key={routine.id} style={styles.row}>
                  <Pressable
                    onPress={() => onPick(routine)}
                    disabled={allThere}
                    style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${routine.name}, ${meta}`}
                    accessibilityState={{ disabled: allThere }}
                  >
                    <Text
                      style={[styles.name, allThere && styles.nameDisabled]}
                      numberOfLines={1}
                    >
                      {routine.name}
                    </Text>
                    <Text style={styles.meta}>{meta}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(routine)}
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete routine ${routine.name}`}
                  >
                    <Feather name="trash-2" size={18} color={palette.danger} />
                  </Pressable>
                </View>
              )
            })}
          </ScrollView>
        </>
      ) : (
        <Text style={styles.hint}>
          No routines yet. Open a day with workouts and tap Save as routine.
        </Text>
      )}
    </BottomSheet>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    hint: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 4,
      paddingBottom: 8,
    },
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    rowMain: {
      flex: 1,
      gap: 2,
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    pressed: {
      opacity: 0.75,
    },
    name: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    nameDisabled: {
      color: c.textDisabled,
    },
    meta: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    // Same round button as the day view's workout cards.
    deleteButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
  })
}
