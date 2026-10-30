import { StyleSheet } from 'react-native'

// The pre-redesign look, split out of TrainingScreen.styles when the Training
// screen moved to src/theme.ts. Values are unchanged.
export function makeStyles(isDark: boolean) {
  const c = isDark
    ? {
        bg: '#0D1117',
        cardBg: '#161B22',
        cardBorder: '#30363D',
        textPrimary: '#E6EDF3',
        detailText: '#C9D1D9',
      }
    : {
        bg: '#F4F6FA',
        cardBg: '#FFFFFF',
        cardBorder: '#D8DFE9',
        textPrimary: '#1A2333',
        detailText: '#2D3748',
      }

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    container: {
      padding: 18,
      gap: 16,
    },
    card: {
      backgroundColor: c.cardBg,
      borderColor: c.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    detailLabel: {
      color: c.detailText,
      textTransform: 'capitalize',
    },
    savedTitle: {
      marginTop: 6,
      color: c.textPrimary,
      fontWeight: '700',
    },
    setRow: {
      gap: 6,
      marginBottom: 12,
    },
    setRowLabel: {
      color: c.textPrimary,
      fontWeight: '700',
      fontSize: 14,
    },
  })
}
