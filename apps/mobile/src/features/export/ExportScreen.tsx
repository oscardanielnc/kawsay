import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/layout/GradientBackground';
import { Segmented } from '@/components/forms/Segmented';
import { Toggle } from '@/components/forms/Toggle';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { color, space, type } from '@/lib/theme';

export const RANGES = [30, 90, 365] as const;
export type RangeDays = (typeof RANGES)[number];

interface Props {
  /** Builds, zips and shares; resolves with the file name. */
  onExport: (choice: { days: RangeDays; includePrivate: boolean }) => Promise<string>;
  /** Asks for the fingerprint or PIN before the private log can be included (F12). */
  onUnlockPrivate: () => Promise<boolean>;
}

type Status =
  { kind: 'idle' } | { kind: 'working' } | { kind: 'done'; name: string } | { kind: 'failed' };

/** Export (F15): period, private log only when chosen, generated on the phone. */
export function ExportScreen({ onExport, onUnlockPrivate }: Props) {
  const { t } = useTranslation();
  const [days, setDays] = useState<RangeDays>(90);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const run = () => {
    setStatus({ kind: 'working' });
    onExport({ days, includePrivate }).then(
      (name) => setStatus({ kind: 'done', name }),
      () => setStatus({ kind: 'failed' }),
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[type.title, styles.ink]}>
            {t('export.title')}
          </Text>
          <Text style={[type.body, styles.muted]}>{t('export.explain')}</Text>
          <Card title={t('export.range')}>
            <Segmented
              options={RANGES.map((value) => ({ value, label: t(`export.ranges.${value}`) }))}
              value={days}
              onChange={setDays}
            />
          </Card>
          <Card>
            <Toggle
              label={t('export.includePrivate')}
              description={t('export.includePrivateHint')}
              value={includePrivate}
              onChange={(on) => {
                if (!on) setIncludePrivate(false);
                else void onUnlockPrivate().then((ok) => ok && setIncludePrivate(true));
              }}
            />
          </Card>
          <Button label={t('export.generate')} disabled={status.kind === 'working'} onPress={run} />
          {status.kind === 'working' ? (
            <Text style={[type.body, styles.muted]}>{t('export.working')}</Text>
          ) : null}
          {status.kind === 'done' ? (
            <Text style={[type.body, styles.ink]}>{t('export.done', { name: status.name })}</Text>
          ) : null}
          {status.kind === 'failed' ? (
            <Text style={[type.body, styles.danger]}>{t('export.failed')}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  ink: { color: color.ink },
  muted: { color: color.inkSoft },
  danger: { color: color.coral800 },
});
