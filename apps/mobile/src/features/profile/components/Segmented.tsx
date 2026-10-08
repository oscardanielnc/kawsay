import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props<T extends string | number> {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** One choice among a few, shown as buttons with a selected state. */
export function Segmented<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[type.label, selected ? styles.onBrand : styles.ink]}>{option.label}</Text>
            {option.hint ? (
              <Text style={[type.caption, selected ? styles.onBrand : styles.muted]}>
                {option.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  option: {
    minHeight: touch,
    minWidth: touch,
    flexGrow: 1,
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: color.brand, borderColor: color.brand },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  onBrand: { color: color.onDark },
});
