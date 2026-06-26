import { StyleSheet } from 'react-native'

export function palette(isDark: boolean) {
  return isDark
    ? {
        bg: '#0D1117',
        cardBg: '#161B22',
        cardBorder: '#30363D',
        textPrimary: '#E6EDF3',
        textSecondary: '#8B949E',
        textMuted: '#6E7681',
        inputBg: '#21262D',
        inputBorder: '#30363D',
        accent: '#58A6FF',
        danger: '#F85149',
        dangerPressed: 'rgba(248, 81, 73, 0.15)',
      }
    : {
        bg: '#F4F6FA',
        cardBg: '#FFFFFF',
        cardBorder: '#D8DFE9',
        textPrimary: '#1A2333',
        textSecondary: '#4A5568',
        textMuted: '#718096',
        inputBg: '#EEF1F6',
        inputBorder: '#C9D3E0',
        accent: '#3B6FD4',
        danger: '#D72638',
        dangerPressed: 'rgba(215, 38, 56, 0.08)',
      }
}

// Theme object for react-native-calendars, derived from the same palette.
export function makeCalendarTheme(isDark: boolean) {
  const c = palette(isDark)
  return {
    calendarBackground: c.cardBg,
    monthTextColor: c.textPrimary,
    dayTextColor: c.textPrimary,
    textSectionTitleColor: c.textSecondary,
    textDisabledColor: c.textMuted,
    todayTextColor: c.accent,
    arrowColor: c.accent,
    selectedDayBackgroundColor: c.accent,
    selectedDayTextColor: '#FFFFFF',
    dotColor: c.accent,
    selectedDotColor: '#FFFFFF',
  }
}

export function makeStyles(isDark: boolean) {
  const c = palette(isDark)

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    container: {
      padding: 18,
      gap: 16,
    },
    toggleButton: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      paddingRight: 12,
    },
    toggleButtonText: {
      color: c.accent,
      fontSize: 16,
      fontWeight: '700',
    },
    heading: {
      color: c.textPrimary,
      fontSize: 24,
      fontWeight: '700',
    },
    helperText: {
      color: c.textMuted,
    },
    calendarCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: c.cardBg,
      borderColor: c.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardTitle: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    deleteButton: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    deleteButtonPressed: {
      backgroundColor: c.dangerPressed,
    },
    deleteButtonText: {
      color: c.danger,
      fontWeight: '700',
      fontSize: 13,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inputGroup: {
      flex: 1,
      gap: 4,
    },
    inputLabel: {
      color: c.textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },
    numberInput: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      backgroundColor: c.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 16,
    },
  })
}
