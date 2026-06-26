import { StyleSheet } from 'react-native'

export type DifficultyVariant = 'beginner' | 'intermediate' | 'advanced'

export const VARIANT_STYLES: Record<DifficultyVariant, { color: string }> = {
  beginner: { color: 'green' },
  intermediate: { color: 'orange' },
  advanced: { color: 'red' },
}

export function makeStyles(isDark: boolean) {
  const c = isDark
    ? {
        bg: '#0D1117',
        cardBg: '#161B22',
        cardBorder: '#30363D',
        textPrimary: '#E6EDF3',
        textSecondary: '#8B949E',
        textMuted: '#6E7681',
        pickerBg: '#21262D',
        pickerBorder: '#30363D',
        detailText: '#C9D1D9',
        imageBg: '#21262D',
        accentBorder: '#30363D',
        resultBg: '#21262D',
        instructionsBg: '#21262D',
        instructionsBorder: '#30363D',
        instructionsText: '#58A6FF',
        modalBg: '#2D333B',
        modalScrim: 'rgba(1, 4, 9, 0.7)',
        panelOverlay: 'rgba(13, 17, 23, 0.80)',
      }
    : {
        bg: '#F4F6FA',
        cardBg: '#FFFFFF',
        cardBorder: '#D8DFE9',
        textPrimary: '#1A2333',
        textSecondary: '#4A5568',
        textMuted: '#718096',
        pickerBg: '#EEF1F6',
        pickerBorder: '#C9D3E0',
        detailText: '#2D3748',
        imageBg: '#EEF1F6',
        accentBorder: '#C9D3E0',
        resultBg: '#FFFFFF',
        instructionsBg: '#EEF1F6',
        instructionsBorder: '#C9D3E0',
        instructionsText: '#3B6FD4',
        modalBg: '#FFFFFF',
        modalScrim: 'rgba(0, 0, 0, 0.4)',
        panelOverlay: 'rgba(244, 246, 250, 0.80)',
      }

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    bootstrapLoader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    bootstrapLoaderText: {
      color: c.textSecondary,
      fontSize: 16,
    },
    bootstrapSpinner: {
      transform: [{ scale: 2.5 }],
    },
    searchSpinner: {
      transform: [{ scale: 2.5 }],
    },
    container: {
      padding: 18,
      gap: 16,
    },
    headingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heading: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
    },
    cogButton: {
      position: 'absolute',
      right: 0,
      padding: 4,
    },
    cogIcon: {
      fontSize: 22,
      color: isDark ? '#8B949E' : '#718096',
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
    fieldLabel: {
      color: c.textSecondary,
      fontWeight: '600',
      marginBottom: -6,
    },
    difficulty: {
      fontWeight: 'bold',
      textTransform: 'capitalize',
      fontSize: 16,
    },
    pickerWrap: {
      borderWidth: 1,
      borderColor: c.pickerBorder,
      borderRadius: 10,
      backgroundColor: c.pickerBg,
    },
    picker: {
      color: c.textPrimary,
    },
    pickerItem: {
      color: c.textPrimary,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    loadingIndicator: {
      alignSelf: 'center',
    },
    workoutPanelWrap: {
      position: 'relative',
    },
    workoutPanel: {
      gap: 8,
    },
    workoutPanelOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.panelOverlay,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailLabel: {
      color: c.detailText,
      textTransform: 'capitalize',
    },
    mediaImage: {
      width: '100%',
      height: 220,
      borderRadius: 10,
      backgroundColor: c.imageBg,
    },
    helperText: {
      color: c.textMuted,
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
      borderColor: c.pickerBorder,
      backgroundColor: c.pickerBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: c.textPrimary,
      fontSize: 16,
    },
    pressedItem: {
      opacity: 0.75,
    },
    resultItem: {
      borderWidth: 1,
      borderColor: c.pickerBorder,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: c.resultBg,
      gap: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    resultItemText: {
      color: c.textPrimary,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    resultItemSubtext: {
      color: c.textMuted,
      textTransform: 'capitalize',
    },
    instructionsButton: {
      alignSelf: 'flex-start',
      backgroundColor: '#3B6FD4',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 9,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    instructionsButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.modalScrim,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: c.modalBg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 14,
      padding: 20,
      width: '100%',
      maxHeight: '70%',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.6 : 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    modalBody: {
      flexShrink: 1,
    },
    modalText: {
      color: c.detailText,
      lineHeight: 22,
    },
    modalClose: {
      backgroundColor: '#3B6FD4',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modalCloseText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    settingsRowLabel: {
      color: c.textPrimary,
      fontSize: 16,
    },
  })
}
