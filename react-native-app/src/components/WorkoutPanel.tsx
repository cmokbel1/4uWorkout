import { useMemo, useState } from "react"
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native"

import type { Workout } from "../types/workout"
import {
  makeStyles,
  VARIANT_STYLES,
  type DifficultyVariant,
} from "../screens/stylesheets/TrainingScreen.styles"

interface WorkoutPanelProps {
  workout: Workout
  isDark: boolean
  // Training shows "Workout: {name}" inline; the detail screen renders the name
  // as its own heading, so it hides the inline label.
  showNameLabel?: boolean
}

// The shared workout detail block: labels, difficulty, image, description, and
// the self-contained Instructions modal. Used by both the Training screen (as
// the current workout) and the Workout Detail screen (as a saved workout).
export function WorkoutPanel({
  workout,
  isDark,
  showNameLabel = true,
}: WorkoutPanelProps) {
  const styles = useMemo(() => makeStyles(isDark), [isDark])
  const [instructionsVisible, setInstructionsVisible] = useState<boolean>(false)

  return (
    <View style={styles.workoutPanel}>
      {showNameLabel ? (
        <Text style={styles.detailLabel}>Workout: {workout.name}</Text>
      ) : null}
      <Text style={styles.detailLabel}>Target: {workout.target}</Text>
      <Text style={styles.detailLabel}>Muscle Group: {workout.bodyPart}</Text>
      <Text style={styles.detailLabel}>Equipment: {workout.equipment}</Text>
      <Text
        style={[
          styles.difficulty,
          VARIANT_STYLES[workout.difficulty as DifficultyVariant],
        ]}
      >
        {workout.difficulty}
      </Text>
      <Image
        source={{ uri: workout.gifUrl }}
        style={styles.mediaImage}
        resizeMode="contain"
      />
      <Text style={styles.detailLabel}>Description: {workout.description}</Text>
      <Pressable
        style={styles.instructionsButton}
        onPress={() => setInstructionsVisible(true)}
        accessibilityLabel="View instructions"
        accessibilityRole="button"
      >
        <Text style={styles.instructionsButtonText}>Instructions</Text>
      </Pressable>

      <Modal
        visible={instructionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInstructionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Instructions</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{workout.instructions}</Text>
            </ScrollView>
            <Pressable
              style={styles.modalClose}
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
