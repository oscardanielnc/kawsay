import { StyleSheet, Text } from 'react-native';
import { color, type } from '@/lib/theme';

/** Uppercase label above a group of cards; on the gradient it uses ink-soft (5.39:1 at the top). */
export function SectionLabel({ text }: { text: string }) {
  return (
    <Text accessibilityRole="header" style={[type.section, styles.label]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({ label: { color: color.inkSoft, marginTop: 4 } });
