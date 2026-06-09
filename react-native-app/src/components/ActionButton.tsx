import { Pressable, Text, ViewStyle } from 'react-native';

import { styles } from './ActionButton.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'accent';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: '#3B6FD4' },
  secondary: { backgroundColor: '#64748B' },
  accent: { backgroundColor: '#0D9488' },
};

export function ActionButton({ label, onPress, variant = 'primary', disabled = false }: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        VARIANT_STYLES[variant],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}
