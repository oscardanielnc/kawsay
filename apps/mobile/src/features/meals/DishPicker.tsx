import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { FoodIcon } from './FoodIcon';
import type { CatalogItem } from './meals-db';
import { searchCatalog } from './search';

const TILES = 12;

interface Props {
  recent: readonly CatalogItem[];
  items: readonly CatalogItem[];
  onPick: (item: CatalogItem) => void;
}

/** Search box, 12 recent dishes as tiles (filtered while typing) and the "Create dish" button (F05). */
export function DishPicker({ recent, items, onPick }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const shown = query.trim() ? searchCatalog(query, items).slice(0, TILES * 2) : recent;
  return (
    <>
      <TextInput
        accessibilityLabel={t('meals.search')}
        placeholder={t('meals.search')}
        placeholderTextColor={color.inkMuted}
        value={query}
        onChangeText={setQuery}
        style={[type.body, styles.search]}
      />
      <View style={styles.grid}>
        {shown.map((item) => (
          <Pressable
            key={`${item.kind}:${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => onPick(item)}
            style={styles.tile}
          >
            <FoodIcon icon={item.icon} />
            <Text numberOfLines={2} style={[type.label, styles.ink]}>
              {item.name}
            </Text>
            {item.kcalPerServing !== null ? (
              <Text style={[type.caption, styles.muted]}>
                {t('meals.kcalPerServing', { kcal: formatNumber(item.kcalPerServing) })}
              </Text>
            ) : null}
          </Pressable>
        ))}
        {shown.length === 0 ? <Text style={[type.body, styles.muted]}>{t('meals.noMatch')}</Text> : null}
      </View>
      <Button
        variant="secondary"
        disabled
        label={query.trim() ? t('meals.createNamed', { name: query.trim() }) : t('meals.create')}
        onPress={() => undefined}
      />
      <Text style={[type.caption, styles.muted]}>{t('meals.createSoon')}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    minHeight: 48,
    color: color.ink,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '31%',
    backgroundColor: color.surface,
    borderRadius: radius.card,
    padding: space.sm,
    gap: space.xs,
    alignItems: 'center',
  },
  ink: { color: color.ink, textAlign: 'center' },
  muted: { color: color.inkMuted, textAlign: 'center' },
});
