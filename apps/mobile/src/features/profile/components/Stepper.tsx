import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  /** What is being changed; also names the buttons ("Menos Edad"). */
  label: string;
  hint?: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}

/** A labelled value with − and + buttons, as in the prototype. */
export function Stepper({ label, hint, value, onDecrement, onIncrement }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[type.heading, styles.ink]}>{label}</Text>
        {hint ? <Text style={[type.caption, styles.muted]}>{hint}</Text> : null}
      </View>
      <View style={styles.control}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.less', { label })}
          onPress={onDecrement}
          style={styles.button}
        >
          <Text style={[type.title, styles.brand]}>−</Text>
        </Pressable>
        <Text style={[type.heading, styles.value]}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.more', { label })}
          onPress={onIncrement}
          style={styles.button}
        >
          <Text style={[type.title, styles.brand]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  text: { flex: 1 },
  control: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    width: touch,
    height: touch,
    borderRadius: radius.pill,
    backgroundColor: color.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 72, textAlign: 'center', color: color.ink },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.brand },
});
