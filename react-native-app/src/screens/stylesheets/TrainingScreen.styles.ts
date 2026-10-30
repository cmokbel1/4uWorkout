import { StyleSheet } from 'react-native'

import { fonts, radius, type Palette } from '../../theme'

// Room under the scroll content so the sticky Find / Save bar never covers it.
export const BOTTOM_BAR_SPACE = 112

export function makeStyles(c: Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    bootstrapLoader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    bootstrapLoaderText: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: BOTTOM_BAR_SPACE,
      gap: 16,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    brand: {
      color: c.accent,
      fontFamily: fonts.extrabold,
      fontSize: 13,
      letterSpacing: 1.4,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 34,
      lineHeight: 40,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: {
      opacity: 0.75,
    },
    navRow: {
      flexDirection: 'row',
      gap: 12,
    },

    // Filter card
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 14,
    },
    sectionLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1,
    },
    difficultyHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    difficultyTitle: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    optional: {
      color: c.textMuted,
      fontFamily: fonts.medium,
    },
    rangeLabel: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    helperText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    selectRow: {
      flexDirection: 'row',
      gap: 12,
    },
    selectCell: {
      flex: 1,
    },

    // Result area
    emptyCard: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.borderStrong,
      borderRadius: radius.lg,
      paddingVertical: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      gap: 10,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 17,
      textAlign: 'center',
    },
    emptyText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    resultCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 16,
      minHeight: 160,
      justifyContent: 'center',
    },
    resultOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.surface,
      opacity: 0.85,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Similar workouts
    similarHeader: {
      gap: 2,
      marginTop: 4,
    },
    similarTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
    },
    similarList: {
      gap: 10,
    },
    similarItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    similarIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    similarIndexText: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    similarText: {
      flex: 1,
      gap: 2,
    },
    similarName: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
      textTransform: 'capitalize',
    },
    similarSub: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      textTransform: 'capitalize',
    },
    tip: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: 14,
    },
    tipText: {
      flex: 1,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
    },

    // Sticky action bar
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },

    // Modals (settings, save)
    modalOverlay: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxHeight: '80%',
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
    modalSubtitle: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 15,
      textTransform: 'capitalize',
    },
    modalBody: {
      flexShrink: 1,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    settingsRowLabel: {
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
    },
    setRow: {
      gap: 8,
      marginBottom: 14,
    },
    setRowLabel: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inputGroup: {
      flex: 1,
      gap: 6,
    },
    inputLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    numberInput: {
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
  })
}
