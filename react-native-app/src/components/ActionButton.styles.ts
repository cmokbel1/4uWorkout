import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    minWidth: 108,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.45,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.1,
    elevation: 1,
  },
  buttonText: {
    color: '#F7FBFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
})
