import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { FoodIcon } from '@/components/data-display/FoodIcon';
import type { CatalogItem } from './meals-db';
import { searchCatalog } from '@kawsay/core/food/search';

const TILES = 12;

interface Props {
  /** The search text; it lives in the sheet, so "back to results" finds it again (F05). */
  query: string;
  onQuery: (query: string) => void;
  recent: readonly CatalogItem[];
  items: readonly CatalogItem[];
  onPick: (item: CatalogItem) => void;
  /** Opens "Create dish" prefilled with the search text (F07). */
  onCreate: (name: string) => void;
  /** Saves the search text as a pending meal, to complete later (F23). */
  onSavePending?: (name: string) => void;
  /** "Crear «…» con IA" for any typed name (F07 v0.2, F23 piece 4); absent without an account. */
  onCreateWithAi?: (name: string) => void;
  /** "Crear desde etiqueta": a packaged food from its label, photo or typed (F23 piece 3). */
  onCreateFromLabel?: (name: string) => void;
}

/** Search box, 12 recent dishes as tiles (filtered while typing) and the "Create dish" button (F05). */
export function DishPicker({
  query,
  onQuery,
  recent,
  items,
  onPick,
  onCreate,
  onSavePending,
  onCreateWithAi,
  onCreateFromLabel,
}: Props) {
  const { t } = useTranslation();
  const shown = query.trim() ? searchCatalog(query, items).slice(0, TILES * 2) : recent;
  return (
    <>
      <TextInput
        accessibilityLabel={t('meals.search')}
        placeholder={t('meals.search')}
        placeholderTextColor={color.inkMuted}
        value={query}
        onChangeText={onQuery}
        style={[type.body, styles.search]}
      />
      <View style={styles.grid}>
        {shown.map((item) => (
          <Pressable
            key={`${item.kind}:${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => {
              Keyboard.dismiss();
              onPick(item);
            }}
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
        {shown.length === 0 ? (
          <Text style={[type.body, styles.muted]}>{t('meals.noMatch')}</Text>
        ) : null}
      </View>
      {onCreateWithAi && query.trim() ? (
        <Button
          label={t('meals.createWithAi', { name: query.trim() })}
          onPress={() => {
            Keyboard.dismiss();
            onCreateWithAi(query.trim());
          }}
        />
      ) : null}
      <Button
        variant="secondary"
        label={query.trim() ? t('meals.createNamed', { name: query.trim() }) : t('meals.create')}
        onPress={() => onCreate(query.trim())}
      />
      {onCreateFromLabel ? (
        <Button
          variant="secondary"
          label={t('meals.createFromLabel')}
          onPress={() => {
            Keyboard.dismiss();
            onCreateFromLabel(query.trim());
          }}
        />
      ) : null}
      {onSavePending && query.trim() ? (
        <Button
          variant="secondary"
          label={t('meals.savePending', { name: query.trim() })}
          onPress={() => {
            Keyboard.dismiss();
            onSavePending(query.trim());
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: color.card,
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
    backgroundColor: color.card,
    borderRadius: radius.card,
    padding: space.sm,
    gap: space.xs,
    alignItems: 'center',
  },
  ink: { color: color.ink, textAlign: 'center' },
  muted: { color: color.inkMuted, textAlign: 'center' },
});
