import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** An on/off row: the whole row is the switch, so the touch target is large. */
export function Toggle({ label, description, value, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={[type.heading, styles.ink]}>{label}</Text>
        {description ? <Text style={[type.caption, styles.muted]}>{description}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch,
    paddingVertical: space.sm,
  },
  text: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  track: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: color.noData,
    padding: 3,
  },
  trackOn: { backgroundColor: color.blue700 },
  thumb: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: color.card },
  thumbOn: { transform: [{ translateX: 20 }] },
});
