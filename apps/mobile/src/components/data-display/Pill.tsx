import { StyleSheet, Text } from 'react-native';
import { color, radius, type } from '@/lib/theme';

/** In range · near · far · below while the day goes on · peach for pending items and sugar notes (Amanecer). */
export type PillTone = 'in' | 'near' | 'far' | 'neutral' | 'peach';

export const PILL: Record<PillTone, { bg: string; ink: string }> = {
  in: { bg: color.blue50, ink: color.blue800 },
  near: { bg: color.amber50, ink: color.amber800 },
  far: { bg: color.coral50, ink: color.coral800 },
  neutral: { bg: color.neutralBg, ink: color.inkSoft },
  peach: { bg: color.peach50, ink: color.peach800 },
};

export function Pill({ tone, text }: { tone: PillTone; text: string }) {
  return (
    <Text
      style={[type.label, styles.pill, { backgroundColor: PILL[tone].bg, color: PILL[tone].ink }]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 12,
  },
});
