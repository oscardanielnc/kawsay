import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  /** When the visible label is ambiguous in a list ("Edit"), the full name for screen readers. */
  accessibilityLabel?: string;
}

/** Primary: blue gradient with white text (5.91:1 on its darkest blue). Secondary: white with a line. */
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
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.dim,
      ]}
    >
      {variant === 'primary' ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="primary" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color.blue500} />
                <Stop offset="1" stopColor={color.blue700} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#primary)" />
          </Svg>
        </View>
      ) : null}
      <Text
        style={[type.heading, styles.text, variant === 'primary' ? styles.onBlue : styles.onLight]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch + 4,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl - 4,
    overflow: 'hidden',
  },
  primary: { backgroundColor: color.blue700 },
  secondary: { backgroundColor: color.card, borderWidth: 1.5, borderColor: color.line },
  link: { backgroundColor: 'transparent', minHeight: touch },
  pressed: { transform: [{ scale: 0.97 }] },
  dim: { opacity: 0.5 },
  text: { fontSize: 15 },
  onBlue: { color: color.white },
  onLight: { color: color.blue700 },
});
