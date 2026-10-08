import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { color, type } from '@/lib/theme';

/** Times one stairs lap once; the result is reused by the routine (F18). */
export function LapStopwatch({ onDone }: { onDone: (seconds: number) => void }) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <Text style={[type.body, styles.muted]}>{t('routines.stopwatchHelp')}</Text>
      <Text accessibilityRole="timer" style={[type.display, styles.clock]}>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </Text>
      <Button label={t('routines.stopwatchDone')} onPress={() => onDone(Math.max(10, seconds))} />
      <Text style={[type.caption, styles.muted]}>{t('routines.stopwatchOnce')}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  muted: { color: color.inkMuted },
  clock: { color: color.ink, textAlign: 'center', fontSize: 56, lineHeight: 64 },
});
