import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'accent';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: '#3B6FD4' },
  secondary: { backgroundColor: '#718096' },
  accent: { backgroundColor: '#2A9D8F' },
};

export function ActionButton({ label, onPress, variant = 'primary', disabled = false }: ActionButtonProps) {
  return (
    <Pressable
      style={[styles.button, VARIANT_STYLES[variant], disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#F7FBFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
