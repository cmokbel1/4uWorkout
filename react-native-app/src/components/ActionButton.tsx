import { Pressable, Text, TextStyle, ViewStyle } from 'react-native';

import { styles } from './ActionButton.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'tertiary';
export type ButtonSize = 'normal' | 'small';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: '#3B6FD4' },
  secondary: { backgroundColor: '#64748B' },
  accent: { backgroundColor: '#0D9488' },
  // Indigo — accents the primary blue without gray's "disabled" read.
  tertiary: { backgroundColor: '#6366F1' },
};

const SIZE_BUTTON_STYLES: Record<ButtonSize, ViewStyle> = {
  normal: {},
  small: { paddingHorizontal: 14, paddingVertical: 8, minWidth: 0 },
};

const SIZE_TEXT_STYLES: Record<ButtonSize, TextStyle> = {
  normal: {},
  small: { fontSize: 13, letterSpacing: 0.2 },
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'normal',
  disabled = false,
}: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        SIZE_BUTTON_STYLES[size],
        VARIANT_STYLES[variant],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, SIZE_TEXT_STYLES[size]]}>{label}</Text>
    </Pressable>
  );
}
