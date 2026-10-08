import { Pressable, StyleSheet, Text } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  /** When the visible label is ambiguous in a list ("Edit"), the full name for screen readers. */
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], (pressed || disabled) && styles.dim]}
    >
      <Text style={[type.heading, variant === 'primary' ? styles.onAccent : styles.onLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch + 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  primary: { backgroundColor: color.accent },
  secondary: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  link: { backgroundColor: 'transparent' },
  dim: { opacity: 0.6 },
  onAccent: { color: color.onDark },
  onLight: { color: color.brand },
});
