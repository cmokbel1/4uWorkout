import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { fonts, getPalette, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"

interface WorkoutPanelProps {
  workout: Workout
  isDark: boolean
  // Training shows the name as the panel's heading; the detail screen renders
  // the name as its own heading, so it hides it here.
  showNameLabel?: boolean
}

// The shared workout detail block: name, detail chips, image, description, and
// the self-contained Instructions sheet. Used by both the Training screen (as
// the current workout) and the Workout Detail screen (as a saved workout).
export function WorkoutPanel({
  workout,
  isDark,
  showNameLabel = true,
}: WorkoutPanelProps) {
  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false)
  const difficultyColor =
    palette[workout.difficulty as "beginner" | "intermediate" | "advanced"] ??
    palette.textMuted

  return (
    <View style={styles.panel}>
      {showNameLabel ? <Text style={styles.name}>{workout.name}</Text> : null}

      <View style={styles.chips}>
        <View style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: difficultyColor }]} />
          <Text style={[styles.chipText, { color: difficultyColor }]}>
            {workout.difficulty}
          </Text>
        </View>
        {[workout.bodyPart, workout.target, workout.equipment].map((detail, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{detail}</Text>
          </View>
        ))}
      </View>

      <Image
        source={{ uri: workout.gifUrl }}
        style={styles.media}
        resizeMode="contain"
        accessibilityLabel={`Demonstration of ${workout.name}`}
      />

      <Text style={styles.description}>{workout.description}</Text>

      <Pressable
        style={({ pressed }) => [styles.instructionsButton, pressed && styles.pressed]}
        onPress={() => setInstructionsVisible(true)}
        accessibilityLabel="View instructions"
        accessibilityRole="button"
      >
        <Feather name="list" size={16} color={palette.accent} />
        <Text style={styles.instructionsButtonText}>Instructions</Text>
      </Pressable>

      <Modal
        visible={instructionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInstructionsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Instructions</Text>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.steps}>
              {workout.instructions.map((step, index) => (
                <View key={index} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              onPress={() => setInstructionsVisible(false)}
              accessibilityLabel="Close instructions"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    panel: {
      gap: 14,
    },
    name: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 22,
      lineHeight: 28,
      textTransform: "capitalize",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceSunken,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    chipText: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 12,
      textTransform: "capitalize",
    },
    media: {
      width: "100%",
      height: 240,
      borderRadius: radius.md,
      backgroundColor: c.surfaceSunken,
    },
    description: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
    },
    instructionsButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceSunken,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    instructionsButtonText: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    pressed: {
      opacity: 0.75,
    },
    overlay: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modal: {
      width: "100%",
      maxHeight: "75%",
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
    modalBody: {
      flexShrink: 1,
    },
    steps: {
      gap: 14,
    },
    step: {
      flexDirection: "row",
      gap: 12,
    },
    stepNumber: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberText: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    stepText: {
      flex: 1,
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
    },
    modalClose: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: "center",
    },
    modalCloseText: {
      color: c.onAccent,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
  })
}
