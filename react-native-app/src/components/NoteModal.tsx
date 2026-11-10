import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { fonts, radius, type Palette } from "../theme"
import { NOTE_MAX_LENGTH } from "../types/workout"
import { ThemedButton } from "./ThemedButton"

interface NoteModalProps {
  palette: Palette
  visible: boolean
  // Shown under the title.
  workoutName: string
  // The note being edited; empty when adding one.
  initialNote?: string
  onCancel: () => void
  // The trimmed note, or undefined when it was cleared.
  onSave: (note: string | undefined) => void
}

// The day view's note editor: one short field, on its own so the keyboard
// has nothing else to crowd. Return saves instead of adding a line, keeping
// notes to a line or two.
export function NoteModal({
  palette,
  visible,
  workoutName,
  initialNote,
  onCancel,
  onSave,
}: NoteModalProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [draft, setDraft] = useState(initialNote ?? "")

  // Start from the saved note each time the dialog opens. Done while
  // rendering (not in an effect) so the old draft never shows for a frame.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setDraft(initialNote ?? "")
  }

  function save(): void {
    const trimmed = draft.trim()
    onSave(trimmed === "" ? undefined : trimmed)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Note</Text>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              onPress={onCancel}
              hitSlop={8}
              accessibilityLabel="Close without saving"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close-thick" size={20} color={palette.text} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{workoutName}</Text>
          <TextInput
            style={styles.input}
            value={draft}
            // Pasted line breaks become spaces; Return saves instead.
            onChangeText={(text) => setDraft(text.replace(/\s*\n\s*/g, " "))}
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            onSubmitEditing={save}
            autoFocus
            maxLength={NOTE_MAX_LENGTH}
            placeholder="e.g. Used the cable machine, left shoulder tight"
            placeholderTextColor={palette.textDisabled}
            accessibilityLabel={`Note for ${workoutName}`}
          />
          <Text style={styles.counter}>
            {draft.length}/{NOTE_MAX_LENGTH}
          </Text>
          <View style={styles.actions}>
            <ThemedButton palette={palette} label="Cancel" variant="secondary" onPress={onCancel} />
            <ThemedButton palette={palette} label="Save" icon="check" onPress={save} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Matches SaveWorkoutModal's dialog.
function makeStyles(c: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    content: {
      width: "100%",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 20,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 20,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.75,
    },
    subtitle: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 15,
      textTransform: "capitalize",
    },
    input: {
      minHeight: 88,
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSunken,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 21,
      textAlignVertical: "top",
    },
    counter: {
      alignSelf: "flex-end",
      marginTop: -4,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
  })
}
