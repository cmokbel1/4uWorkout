import { Feather } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"
import { InstructionsModal } from "./InstructionsModal"

interface WorkoutPanelProps {
  workout: Workout
  palette: Palette
  // Training shows the name as the panel's heading; the detail screen renders
  // the name as its own heading, so it hides it here.
  showNameLabel?: boolean
  // Called when the image has finished loading, or failed to, so a caller can
  // hold back other UI until the panel is fully drawn.
  onImageLoad?: () => void
}

// The shared workout detail block: name, detail chips, image, description, and
// the self-contained Instructions sheet. Used by both the Training screen (as
// the current workout) and the Workout Detail screen (as a saved workout).
export function WorkoutPanel({
  workout,
  palette,
  showNameLabel = true,
  onImageLoad,
}: WorkoutPanelProps) {
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
        onLoadEnd={onImageLoad}
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

      <InstructionsModal
        palette={palette}
        visible={instructionsVisible}
        onClose={() => setInstructionsVisible(false)}
        instructions={workout.instructions}
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
