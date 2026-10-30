import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  icon: string;
  title: string;
  summary: string;
  onPress: () => void;
}

/** A settings entry: icon, title and the current value; opens its editor. */
export function SettingsRow({ icon, title, summary, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary}`}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.icon}>
        <Text style={styles.emoji}>{icon}</Text>
      </View>
      <View style={styles.text}>
        <Text style={[type.heading, styles.ink]}>{title}</Text>
        <Text style={[type.caption, styles.muted]}>{summary}</Text>
      </View>
      <Text style={[type.title, styles.muted]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch + 8 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.card - 2,
    backgroundColor: color.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  text: { flex: 1 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
