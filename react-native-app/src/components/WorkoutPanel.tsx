import { Feather } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { useSpokenSteps } from "../hooks/useSpokenSteps"
import type { DatedNote } from "../storage/savedWorkouts"
import { fonts, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"
import { InstructionsModal } from "./InstructionsModal"
import { PreviousNotes } from "./PreviousNotes"

interface WorkoutPanelProps {
  workout: Workout
  palette: Palette
  // Called when the image has finished loading, or failed to, so a caller can
  // hold back other UI until the panel is fully drawn.
  onImageLoad?: () => void
  // The user's notes on this exercise from saved days, newest first.
  previousNotes: DatedNote[]
}

// The Training screen's workout block: name, detail chips, image, description,
// the newest note from a past session ("Last time"), and Instructions / Listen
// buttons. Listen reads the steps aloud here, so the image stays in view; the
// Instructions dialog shows the same reading.
// (Workout Detail has its own layout.)
export function WorkoutPanel({
  workout,
  palette,
  onImageLoad,
  previousNotes,
}: WorkoutPanelProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false)
  // Training stays mounted under the screens it opens, so stop on blur.
  const isFocused = useIsFocused()
  const speech = useSpokenSteps(workout.instructions, isFocused)
  const difficultyColor =
    palette[workout.difficulty as "beginner" | "intermediate" | "advanced"] ??
    palette.textMuted

  return (
    <View style={styles.panel}>
      <Text style={styles.name}>{workout.name}</Text>

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
        onLoadEnd={onImageLoad}
        accessibilityLabel={`Demonstration of ${workout.name}`}
      />

      <Text style={styles.description}>{workout.description}</Text>

      <PreviousNotes palette={palette} notes={previousNotes} />

      <View style={styles.instructionsActions}>
        <Pressable
          style={({ pressed }) => [styles.instructionsButton, pressed && styles.pressed]}
          onPress={() => setInstructionsVisible(true)}
          accessibilityLabel="View instructions"
          accessibilityRole="button"
        >
          <Feather name="list" size={16} color={palette.accent} />
          <Text style={styles.instructionsButtonText}>Instructions</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.instructionsButton, pressed && styles.pressed]}
          onPress={speech.toggle}
          accessibilityLabel={speech.isSpeaking ? "Stop reading instructions" : "Read instructions aloud"}
          accessibilityRole="button"
        >
          <Feather
            name={speech.isSpeaking ? "square" : "volume-2"}
            size={16}
            color={palette.accent}
          />
          <Text style={styles.instructionsButtonText}>
            {speech.isSpeaking ? "Stop" : "Listen"}
          </Text>
        </Pressable>
      </View>

      <InstructionsModal
        palette={palette}
        visible={instructionsVisible}
        onClose={() => setInstructionsVisible(false)}
        instructions={workout.instructions}
        currentStep={speech.currentStep}
        isSpeaking={speech.isSpeaking}
        onToggleSpeech={speech.toggle}
      />
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
      // The GIFs have white backgrounds; matching it avoids dark bars beside
      // the image in dark mode.
      backgroundColor: "#FFFFFF",
    },
    description: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
    },
    instructionsActions: {
      flexDirection: "row",
      gap: 10,
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
  })
}
