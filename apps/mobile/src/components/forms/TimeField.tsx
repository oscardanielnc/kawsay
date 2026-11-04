import type { ClockTime } from '@kawsay/core/shared/clock-time';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, touch, type } from '@/lib/theme';

interface Props {
  /** What the time is; also names the buttons ("Me desperté 07:00", "Me desperté: hora 08"). */
  label: string;
  value: ClockTime;
  onChange: (next: ClockTime) => void;
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'] as const;

/**
 * A time picked in two taps: tap the time, then its hour and its minutes. Replaces −/+ steppers for times
 * (owner, 2026-11-04: moving 13:00 to 08:00 took him two minutes of taps). No native module, so no new APK.
 */
export function TimeField({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hour = '00', minute = '00'] = value.split(':');
  const set = (h: string, m: string) => onChange(`${h}:${m}`);

  return (
    <View style={styles.field}>
      <View style={styles.row}>
        <Text style={[type.heading, styles.ink, styles.grow]}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} ${value}`}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((o) => !o)}
          style={[styles.value, open && styles.valueOpen]}
        >
          <Text style={[type.heading, open ? styles.onBrand : styles.brand]}>{value}</Text>
        </Pressable>
      </View>
      {open ? (
        <View style={styles.panel}>
          <Text style={[type.caption, styles.muted]}>{t('form.time.hour')}</Text>
          <View style={styles.grid}>
            {HOURS.map((h) => (
              <Chip
                key={h}
                text={h}
                name={t('form.time.hourLabel', { label, hour: h })}
                on={h === hour}
                onPress={() => set(h, minute)}
              />
            ))}
          </View>
          <Text style={[type.caption, styles.muted]}>{t('form.time.minutes')}</Text>
          <View style={styles.grid}>
            {MINUTES.map((m) => (
              <Chip
                key={m}
                text={`:${m}`}
                name={t('form.time.minutesLabel', { label, minutes: m })}
                on={m === minute}
                onPress={() => {
                  set(hour, m);
                  setOpen(false);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Chip(props: { text: string; name: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.name}
      accessibilityState={{ selected: props.on }}
      onPress={props.onPress}
      style={[styles.chip, props.on && styles.chipOn]}
    >
      <Text style={[type.label, props.on ? styles.onBrand : styles.ink]}>{props.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { paddingVertical: space.xs, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  value: {
    minWidth: 96,
    minHeight: touch,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: color.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueOpen: { backgroundColor: color.blue700 },
  panel: {
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.inner,
    backgroundColor: color.surface2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    width: '15%',
    minHeight: touch,
    flexGrow: 1,
    borderRadius: radius.chip,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: color.blue700 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.blue700 },
  onBrand: { color: color.card },
});
