import { useMemo } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Instructions</Text>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.steps}>
            {instructions.map((step, index) => (
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
    pressed: {
      opacity: 0.75,
    },
  })
}
