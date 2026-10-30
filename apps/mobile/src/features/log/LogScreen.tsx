import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/layout/GradientBackground';
import Svg, { Circle, Path } from 'react-native-svg';
import { color, radius, space, type, screenPadding, tabBarSpace } from '@/lib/theme';

/** Tiles of the quick-log grid and the Today section each opens (design N1). */
export type LogTile =
  'meals' | 'bathroom' | 'activity' | 'water' | 'mood' | 'sleep' | 'weight' | 'note';
const TILES: readonly { tile: LogTile; bg: string; ink: string; d: string }[] = [
  { tile: 'meals', bg: color.peach50, ink: color.peach800, d: 'M5 12a7 7 0 0 0 14 0zM4 12h16' },
  {
    tile: 'bathroom',
    bg: color.amber50,
    ink: color.amber800,
    d: 'M6 19h12c2 0 3-1.5 3-3s-1-2.5-2-3c.5-1.8-.8-3.2-2.4-3.2C16.6 7.5 15 6 13 6c-.3-1.5-1-2-2-2 .5 1.5-.5 2-1.5 2.5C8 7 7.4 8.6 8 10c-1.8.2-3 1.5-3 3-1 .5-2 1.5-2 3s1 3 3 3z',
  },
  {
    tile: 'activity',
    bg: color.blue50,
    ink: color.blue700,
    d: 'M13 4a1.5 1.5 0 1 0 0 .1M10 21l2-6 3 3v3M8 12l3-4 4 2 3-1',
  },
  { tile: 'water', bg: color.blue50, ink: color.blue500, d: 'M6 3h12l-1.5 17h-9z' },
  { tile: 'mood', bg: color.amber50, ink: color.amber800, d: 'M8.5 14c1.8 2 5.2 2 7 0' },
  {
    tile: 'sleep',
    bg: color.blue50,
    ink: color.blue800,
    d: 'M19 14A7 7 0 1 1 10 5a5.5 5.5 0 0 0 9 9z',
  },
  {
    tile: 'weight',
    bg: color.surface2,
    ink: color.inkSoft,
    d: 'M5 20h14l-2-12H7zM9 8a3 3 0 0 1 6 0',
  },
  {
    tile: 'note',
    bg: color.coral50,
    ink: color.coral800,
    d: 'M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h3',
  },
];

/** The (+) tab: one tile per thing to log; Water adds a glass right away (Today v3 prototype). */
export function LogScreen({ onPick }: { onPick: (tile: LogTile) => void }) {
  const { t } = useTranslation();
  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[type.display, styles.ink]}>
            {t('log.title')}
          </Text>
          <Text style={[type.body, styles.muted]}>{t('log.hint')}</Text>
          <View style={styles.grid}>
            {TILES.map(({ tile, bg, ink, d }) => (
              <Pressable
                key={tile}
                accessibilityRole="button"
                accessibilityLabel={tile === 'water' ? t('log.waterAdded') : t(`log.tiles.${tile}`)}
                onPress={() => onPick(tile)}
                style={styles.tile}
              >
                <View style={[styles.icon, { backgroundColor: bg }]}>
                  <Svg
                    width={26}
                    height={26}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={ink}
                    strokeWidth={2}
                  >
                    {tile === 'mood' ? <Circle cx={12} cy={12} r={9} /> : null}
                    <Path d={d} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text style={[type.label, styles.ink]}>{t(`log.tiles.${tile}`)}</Text>
              </Pressable>
            ))}
            <View style={[styles.tile, styles.dim]}>
              <View style={[styles.icon, { backgroundColor: color.coral50 }]} />
              <Text style={[type.label, styles.ink]}>{t('log.tiles.write')}</Text>
              <Text style={[type.caption, styles.muted]}>{t('log.soon')}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: screenPadding, paddingBottom: tabBarSpace, gap: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '31%',
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: color.card,
    borderRadius: radius.card,
    padding: space.sm,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.5 },
  ink: { color: color.ink },
  muted: { color: color.inkSoft },
});
