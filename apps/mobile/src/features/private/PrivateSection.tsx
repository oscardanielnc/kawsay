import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Card } from '@/components/layout/Card';
import { color, radius, space, touch, type } from '@/lib/theme';
import type { IntimateEntry, IntimateKind } from './private-db';

interface Props {
  /** null while locked: the route reads nothing until the user unlocks (F12). */
  entries: readonly IntimateEntry[] | null;
  onUnlock: () => void;
  onLock: () => void;
  onAdd: (kind: IntimateKind) => void;
  onDelete: (id: string) => void;
}

const KINDS: readonly IntimateKind[] = ['sex', 'masturbation'];

function Lock() {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color.blue700}
      strokeWidth={2}
    >
      <Rect x={5} y={10} width={14} height={10} rx={2.5} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

/** Private (F12): locked behind the fingerprint or PIN; when open, one tap logs each kind. */
export function PrivateSection({ entries, onUnlock, onLock, onAdd, onDelete }: Props) {
  const { t } = useTranslation();
  const locked = entries === null;
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(locked ? 'private.unlock' : 'private.lock')}
        onPress={locked ? onUnlock : onLock}
        style={styles.header}
      >
        <View style={styles.icon}>
          <Lock />
        </View>
        <View style={styles.grow}>
          <Text style={[type.heading, styles.ink]}>{t('private.title')}</Text>
          <Text style={[type.caption, styles.muted]}>
            {t(locked ? 'private.unlockHint' : 'private.lockHint')}
          </Text>
        </View>
      </Pressable>
      {entries ? (
        <>
          <View style={styles.chips}>
            {entries.map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={t('private.remove', { kind: t(`private.kinds.${e.kind}`) })}
                onPress={() => onDelete(e.id)}
                style={[styles.chip, styles.on]}
              >
                <Text style={[type.label, styles.ink]}>{`${t(`private.kinds.${e.kind}`)} ×`}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chips}>
            {KINDS.map((kind) => (
              <Pressable
                key={kind}
                accessibilityRole="button"
                accessibilityLabel={t('private.add', { kind: t(`private.kinds.${kind}`) })}
                onPress={() => onAdd(kind)}
                style={[styles.chip, styles.add]}
              >
                <Text style={[type.label, styles.accent]}>{`+ ${t(`private.kinds.${kind}`)}`}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.caption, styles.muted]}>{t('private.note')}</Text>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touch },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.chip,
    backgroundColor: color.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touch,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
  },
  on: { borderColor: color.blue700, backgroundColor: color.blue50 },
  add: { borderStyle: 'dashed', borderColor: color.blue700 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  accent: { color: color.blue700 },
});
