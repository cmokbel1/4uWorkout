import { StyleSheet } from 'react-native'

import { fonts, radius, type Palette } from '../../theme'

export function makeStyles(c: Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 16,
    },
    pressed: {
      opacity: 0.75,
    },
    backButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    backButtonText: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    media: {
      width: '100%',
      height: 240,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      // The GIFs have white backgrounds; matching it avoids bars beside them.
      backgroundColor: '#FFFFFF',
    },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 6,
    },
    // Three bars of increasing height, filled up to the workout's level.
    levelBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
    },
    levelBar: {
      width: 4,
      borderRadius: 1,
      backgroundColor: c.borderStrong,
    },
    levelBarOn: {
      backgroundColor: c.accent,
    },
    levelText: {
      color: c.accent,
      fontFamily: fonts.extrabold,
      fontSize: 13,
      letterSpacing: 1.2,
    },
    name: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 24,
      lineHeight: 30,
      textTransform: 'capitalize',
    },
    tiles: {
      flexDirection: 'row',
      gap: 10,
    },
    tile: {
      flex: 1,
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    tileLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    tileValue: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
      textTransform: 'capitalize',
    },
    description: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 15,
      lineHeight: 22,
    },
    instructionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 60,
      paddingHorizontal: 16,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    playIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      // Feather's play glyph sits left of centre.
      paddingLeft: 2,
    },
    instructionsText: {
      flex: 1,
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    sets: {
      gap: 10,
      marginTop: 4,
    },
    setsHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    setsTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
    },
    setsCount: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    setLabel: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    setValue: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
  })
}
