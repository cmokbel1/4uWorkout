import { Feather } from "@expo/vector-icons"
import { useMemo } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { useSpokenSteps } from "../hooks/useSpokenSteps"
import { fonts, radius, type Palette } from "../theme"

interface InstructionsModalProps {
  palette: Palette
  visible: boolean
  onClose: () => void
  instructions: string[]
}

// A workout's instructions as numbered steps, in a centred dialog.
export function InstructionsModal({
  palette,
  visible,
  onClose,
  instructions,
}: InstructionsModalProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  // The modal stays mounted while hidden, so `visible` is what ends reading,
  // however it gets closed (Close, Android back, the parent hiding it).
  const { currentStep, isSpeaking, start, stop } = useSpokenSteps(instructions, visible)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Instructions</Text>
            <Pressable
              style={({ pressed }) => [styles.speakButton, pressed && styles.pressed]}
              onPress={isSpeaking ? stop : start}
              hitSlop={8}
              accessibilityLabel={isSpeaking ? "Stop reading instructions" : "Read instructions aloud"}
              accessibilityRole="button"
            >
              <Feather name={isSpeaking ? "square" : "volume-2"} size={18} color={palette.accent} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.steps}>
            {instructions.map((step, index) => {
              const active = index === currentStep
              return (
                <View key={index} style={[styles.step, active && styles.stepActive]}>
                  <View style={[styles.stepNumber, active && styles.stepNumberActive]}>
                    <Text style={[styles.stepNumberText, active && styles.stepNumberTextActive]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              )
            })}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
            onPress={onClose}
            accessibilityLabel="Close instructions"
            accessibilityRole="button"
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 20,
    },
    speakButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    modalBody: {
      flexShrink: 1,
    },
    steps: {
      gap: 14,
    },
    // Padded and bordered all the time (transparent until active) so the
    // highlight doesn't shift the text when it moves between steps.
    step: {
      flexDirection: "row",
      gap: 12,
      padding: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: "transparent",
    },
    stepActive: {
      backgroundColor: c.surfaceRaised,
      borderColor: c.accent,
    },
    stepNumber: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNumberActive: {
      backgroundColor: c.accent,
    },
    stepNumberText: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    stepNumberTextActive: {
      color: c.onAccent,
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
    pressed: {
      opacity: 0.75,
    },
  })
}
