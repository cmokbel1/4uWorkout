import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import type { DatedNote } from "../storage/savedWorkouts"
import { fonts, type Palette } from "../theme"
import { formatShortDate } from "../utils/date"
import { BottomSheet } from "./BottomSheet"

interface PreviousNotesProps {
  palette: Palette
  // The exercise's earlier notes, newest first (from notesForExercise).
  notes: DatedNote[]
}

// A small "Last time: …" line with the newest note, kept quiet so it doesn't
// pull focus from the buttons around it. Tapping it opens every note in a
// sheet (the line is cut at two lines, so this is how a long note is read in
// full). Renders nothing when there are no notes.
export function PreviousNotes({ palette, notes }: PreviousNotesProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [open, setOpen] = useState(false)

  if (!notes.length) return null

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={`Last time: ${notes[0].note}. Show ${
          notes.length === 1 ? "note" : `all ${notes.length} notes`
        }`}
      >
        <Text style={styles.lastText} numberOfLines={2}>
          Last time: {notes[0].note}
        </Text>
        {notes.length > 1 ? (
          <Text style={styles.link}>All notes ({notes.length})</Text>
        ) : null}
      </Pressable>

      <BottomSheet
        palette={palette}
        visible={open}
        onClose={() => setOpen(false)}
        title="Notes"
      >
        <ScrollView style={styles.list}>
          {notes.map((entry) => (
            <View key={entry.date} style={styles.entry}>
              <Text style={styles.entryDate}>{formatShortDate(entry.date).toUpperCase()}</Text>
              <Text style={styles.entryNote}>{entry.note}</Text>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.75,
    },
    lastText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 17,
    },
    link: {
      marginTop: 2,
      color: c.accent,
      fontFamily: fonts.semibold,
      fontSize: 12,
    },
    list: {
      flexGrow: 0,
    },
    entry: {
      gap: 4,
      paddingHorizontal: 4,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    entryDate: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    entryNote: {
      color: c.text,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
    },
  })
}
