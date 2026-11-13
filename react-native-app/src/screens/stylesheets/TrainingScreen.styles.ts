import { StyleSheet } from 'react-native'

import { fonts, radius, type Palette } from '../../theme'

// Room under the scroll content so the sticky Find / Save bar never covers it.
// (The tab bar sits below the screen, so no safe-area inset is needed here.)
export const BOTTOM_BAR_SPACE = 100

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
      paddingTop: 16,
      paddingBottom: BOTTOM_BAR_SPACE,
      gap: 16,
    },

    // Holds the scroll view and the floating top bar, so the bar's top: 0 is
    // the top of the safe area.
    body: {
      flex: 1,
    },

    // A small caps heading over the screen's main control ("FIND A WORKOUT
    // FOR ME" here, "SEARCH EXERCISES" on Search), and its wrapper.
    controlSection: {
      gap: 8,
    },
    sectionLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1,
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
    emptySteps: {
      gap: 8,
      marginVertical: 2,
    },
    emptyStep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    emptyStepText: {
      color: c.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    // Step number (a check once done) in the placeholder card.
    emptyStepIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStepIndexText: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 12,
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

    // Inline "no matches" state: an empty-state card with an action under it.
    emptyAction: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      marginTop: 6,
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
      paddingVertical: 12,
      backgroundColor: c.dock,
      borderTopWidth: 1,
      borderTopColor: c.dockEdge,
      // Casts upward over the content. shadow* is iOS, elevation is Android.
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
  })
}
