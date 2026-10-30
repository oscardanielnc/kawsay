import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, radius, space, type } from '@/lib/theme';

/** A logged item: soft blue pill with an icon; `pending` is dashed peach (F23). */
export function Chip({
  label,
  icon,
  pending = false,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  icon?: ReactNode;
  pending?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[styles.chip, pending && styles.pending, !icon && styles.textOnly]}
    >
      {icon}
      <Text numberOfLines={1} style={[type.label, pending ? styles.pendingInk : styles.ink]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    backgroundColor: color.chip,
    borderRadius: radius.pill,
    paddingLeft: 4,
    paddingRight: space.md,
    minHeight: 36,
    maxWidth: '100%',
  },
  textOnly: { paddingLeft: space.md },
  pending: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.peach300,
    backgroundColor: color.peach50,
  },
  ink: { color: color.ink },
  pendingInk: { color: color.peach800 },
});
