import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/layout/Card';
import type { Exposure, InsightsData, Relation } from './types';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';

/** At most this many relations, strongest confidence first. */
const SHOWN = 6;
const pct = (n: number) => `${formatNumber(n * 100)} %`;

/**
 * "What lines up with your symptoms" (F17, ADR 0019): the relations counted on the phone, each with its numbers and
 * a confidence level; the AI analysis has its own card. Never a diagnosis.
 */
export function RelationsCard({ relations }: { relations: InsightsData['relations'] }) {
  const { t } = useTranslation();
  const [doctor, setDoctor] = useState(false);
  const exposureName = (e: Exposure) =>
    e.kind === 'tag' ? t(`insights.relations.tags.${e.id}`) : `🍽️ ${e.name}`;
  const effect = (r: Relation, part: 'raises' | 'lowers' | 'bad') =>
    r.symptom.kind === 'own'
      ? t(`insights.relations.effect.own.${part}`, { name: r.symptom.name.toLowerCase() })
      : t(`insights.relations.effect.${r.symptom.id}.${part}`);

  let body;
  if (relations.status === 'need-days')
    body = (
      <Text style={[type.body, styles.muted]}>
        {t('insights.relations.needDays', { count: relations.loggedDays })}
      </Text>
    );
  else if (relations.findings.length === 0)
    body = <Text style={[type.body, styles.muted]}>{t('insights.relations.none')}</Text>;
  else
    body = relations.findings.slice(0, SHOWN).map((r) => {
      // A lower rate of bad days is always good news (energy: bad = low energy).
      const good = r.direction === 'lowers';
      return (
        <View
          key={`${r.exposure.kind}:${'id' in r.exposure ? r.exposure.id : ''}:${r.symptom.id}`}
          style={styles.relation}
        >
          <Text style={[type.label, styles.ink]}>
            {`${exposureName(r.exposure)} `}
            <Text style={{ color: good ? color.blue800 : color.coral800 }}>
              {effect(r, r.direction)}
            </Text>
          </Text>
          <Text style={[type.caption, styles.muted]}>
            {t('insights.relations.detail', {
              bad: effect(r, 'bad'),
              exposedBad: r.exposedBad,
              exposedDays: r.exposedDays,
              exposedPct: pct(r.exposedRate),
              baselineBad: r.baselineBad,
              baselineDays: r.baselineDays,
              baselinePct: pct(r.baselineRate),
            })}
          </Text>
          <View style={styles.meta}>
            <View style={styles.confidence}>
              <Text style={[type.caption, styles.confidenceText]}>
                {t(`insights.relations.confidence.${r.confidence}`)}
              </Text>
            </View>
            <Text style={[type.caption, styles.muted]}>
              {t('insights.relations.times', { count: r.occurrences })}
            </Text>
          </View>
        </View>
      );
    });

  return (
    <Card>
      <Text accessibilityRole="header" style={[type.heading, styles.ink]}>
        {t('insights.relations.title')}
      </Text>
      {body}
      <Text style={[type.caption, styles.muted]}>{t('insights.relations.disclaimer')}</Text>
      <Pressable accessibilityRole="button" onPress={() => setDoctor(!doctor)}>
        <Text style={[type.label, styles.brand]}>{t('insights.relations.doctor')}</Text>
      </Pressable>
      {doctor ? (
        <Text style={[type.caption, styles.ink]}>{t('insights.relations.doctorBody')}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  relation: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.card - 2,
    backgroundColor: color.surface2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  confidence: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.blue50,
  },
  confidenceText: { color: color.blue800 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  brand: { color: color.blue700 },
});
