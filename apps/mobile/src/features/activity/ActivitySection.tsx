import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIcon } from '@/components/data-display/ActivityIcon';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import type { TimeBand } from './activity-db';
import { AddActivity, type NewActivityChoice } from './AddActivity';

/** One logged activity as the day shows it; kcal come from the route (they follow the day's BMR). */
export interface ActivityView {
  id: string;
  name: string;
  icon: string;
  minutes: number;
  intensity: 'light' | 'medium' | 'hard' | null;
  timeBand: TimeBand | null;
  kcal: number;
  /** For routine sessions logged below 100 %. */
  share?: number;
}

interface Props {
  entries: readonly ActivityView[];
  noActivity: boolean;
  bmrKcal: number;
  defaultBand: TimeBand;
  onAdd: (choice: NewActivityChoice) => void;
  onDelete: (id: string) => void;
  onNoActivity: (on: boolean) => void;
  /** The user's routines (F18), composed by the route. */
  children?: ReactNode;
}

/** Physical activity of the day (F08): the base day, logged activities and the add sheet. */
export function ActivitySection({
  entries,
  noActivity,
  bmrKcal,
  defaultBand,
  onAdd,
  onDelete,
  onNoActivity,
  children,
}: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const minutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const kcal = entries.reduce((sum, e) => sum + e.kcal, 0);
  const detail = (e: ActivityView) =>
    [
      `${formatNumber(e.minutes)}′`,
      e.intensity ? t(`activity.intensities.${e.intensity}`) : null,
      e.timeBand ? t(`activity.bands.${e.timeBand}`) : null,
      `+${formatNumber(e.kcal)} kcal`,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Card title={t('activity.title')}>
      {minutes > 0 ? (
        <Text style={[type.label, styles.muted]}>
          {t('activity.summary', { minutes: formatNumber(minutes), kcal: formatNumber(kcal) })}
        </Text>
      ) : null}
      {entries.map((e) => (
        <View key={e.id} style={styles.row}>
          <ActivityIcon kind={e.icon} />
          <View style={styles.grow}>
            <Text style={[type.heading, styles.ink]}>
              {e.name}
              {e.share !== undefined && e.share < 1 ? ` (${formatNumber(e.share * 100)} %)` : ''}
            </Text>
            <Text style={[type.caption, styles.muted]}>{detail(e)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('activity.remove', { name: e.name })}
            onPress={() => onDelete(e.id)}
            style={styles.remove}
          >
            <Text style={[type.title, styles.muted]}>×</Text>
          </Pressable>
        </View>
      ))}
      {entries.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: noActivity }}
          accessibilityLabel={`${t('activity.noActivity')}. ${t(noActivity ? 'activity.noActivityOn' : 'activity.noActivityOff')}`}
          onPress={() => onNoActivity(!noActivity)}
          style={[styles.noActivity, noActivity && styles.noActivityOn]}
        >
          <ActivityIcon kind="housework" />
          <View style={styles.grow}>
            <Text style={[type.heading, styles.ink]}>{t('activity.noActivity')}</Text>
            <Text style={[type.caption, styles.muted]}>
              {t(noActivity ? 'activity.noActivityOn' : 'activity.noActivityOff')}
            </Text>
          </View>
        </Pressable>
      ) : null}
      {noActivity ? null : (
        <>
          <Button
            variant="secondary"
            label={t('activity.addButton')}
            onPress={() => setAdding(true)}
          />
          {children}
        </>
      )}
      <Sheet
        title={adding ? t('activity.addTitle') : null}
        onDone={() => setAdding(false)}
        footer={<View />}
      >
        <AddActivity
          bmrKcal={bmrKcal}
          defaultBand={defaultBand}
          onAdd={(choice) => {
            onAdd(choice);
            setAdding(false);
          }}
        />
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  remove: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  noActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.md,
  },
  noActivityOn: { borderColor: color.brand, backgroundColor: color.green50 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
