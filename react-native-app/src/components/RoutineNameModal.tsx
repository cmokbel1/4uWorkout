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
import { ROUTINE_NAME_MAX_LENGTH } from "../types/routine"
import { ThemedButton } from "./ThemedButton"

interface RoutineNameModalProps {
  palette: Palette
  visible: boolean
  // How many workouts the routine will hold, shown under the title.
  workoutCount: number
  onCancel: () => void
  // The trimmed name; never empty.
  onSave: (name: string) => void
}

// The day view's "Save as routine" dialog: one name field. Laid out like
// NoteModal.
export function RoutineNameModal({
  palette,
  visible,
  workoutCount,
  onCancel,
  onSave,
}: RoutineNameModalProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [draft, setDraft] = useState("")
  const name = draft.trim()

  // Start empty each time the dialog opens. Done while rendering (not in an
  // effect) so the old name never shows for a frame.
  const [wasVisible, setWasVisible] = useState(visible)
  if (visible !== wasVisible) {
    setWasVisible(visible)
    if (visible) setDraft("")
  }

  function save(): void {
    if (name) onSave(name)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Save as routine</Text>
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
          <Text style={styles.subtitle}>
            {workoutCount} {workoutCount === 1 ? "workout" : "workouts"}. Reps, weight and notes
            aren't saved with the routine.
          </Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            returnKeyType="done"
            onSubmitEditing={save}
            autoFocus
            maxLength={ROUTINE_NAME_MAX_LENGTH}
            placeholder="e.g. Push day"
            placeholderTextColor={palette.textDisabled}
            accessibilityLabel="Routine name"
          />
          <Text style={styles.counter}>
            {draft.length}/{ROUTINE_NAME_MAX_LENGTH}
          </Text>
          <View style={styles.actions}>
            <ThemedButton palette={palette} label="Cancel" variant="secondary" onPress={onCancel} />
            <ThemedButton
              palette={palette}
              label="Save"
              icon="check"
              onPress={save}
              disabled={!name}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// Matches NoteModal's dialog.
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
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSunken,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
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
