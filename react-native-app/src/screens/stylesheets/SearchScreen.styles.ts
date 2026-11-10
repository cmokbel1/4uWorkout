import { StyleSheet } from 'react-native'

import { fonts, radius, type Palette } from '../../theme'
import { makeStyles as makeTrainingStyles } from './TrainingScreen.styles'

// Search shares Training's layout: the same scroll content, result and
// empty-state cards, and bottom bar. Only the search field is its own.
export function makeStyles(c: Palette) {
  return {
    ...makeTrainingStyles(c),
    ...StyleSheet.create({
      searchSection: {
        gap: 8,
      },
      labelRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      },
      sectionLabel: {
        color: c.textMuted,
        fontFamily: fonts.bold,
        fontSize: 12,
        letterSpacing: 1,
      },
      counter: {
        color: c.textMuted,
        fontFamily: fonts.semibold,
        fontSize: 12,
      },
      searchRow: {
        flexDirection: 'row',
        gap: 10,
      },
      field: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        paddingLeft: 14,
        paddingRight: 8,
        backgroundColor: c.surface,
        borderWidth: 1.5,
        borderColor: c.borderStrong,
        borderRadius: radius.md,
      },
      fieldFocused: {
        borderColor: c.accent,
      },
      input: {
        flex: 1,
        color: c.text,
        fontFamily: fonts.semibold,
        fontSize: 16,
        paddingVertical: 12,
      },
      clearButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surfaceRaised,
      },
      searchButton: {
        minHeight: 52,
        paddingHorizontal: 18,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.accent,
      },
      searchButtonText: {
        color: c.onAccent,
        fontFamily: fonts.extrabold,
        fontSize: 15,
      },
      // A short line under the field: the 3-letter hint, the length limit,
      // or why the last search failed.
      notice: {
        color: c.textMuted,
        fontFamily: fonts.medium,
        fontSize: 13,
        lineHeight: 18,
      },
      shuffleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: c.onAccentMuted,
        borderWidth: 1,
        borderColor: c.accent,
      },
      shuffleText: {
        color: c.accent,
        fontFamily: fonts.extrabold,
        fontSize: 14,
      },
      pressed: {
        opacity: 0.75,
      },
      disabled: {
        opacity: 0.45,
      },
    }),
  }
}
