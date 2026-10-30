import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import { CreateDish } from './CreateDish';
import { DishPicker } from './DishPicker';
import { FoodIcon } from './FoodIcon';
import type { CatalogItem, Meal, MealEntryView, NewDish } from './meals-db';
import { fractionLabel } from './portion';
import { eatenShare, PortionPicker, type Portion } from './PortionPicker';
import type { ItemDetail } from './catalog-detail';
import { ItemDetailView } from './ItemDetailView';

export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface AddMeal {
  meal: Meal;
  item: CatalogItem;
  servings?: number;
  grams?: number;
  saveRestForTomorrow: boolean;
}

interface Props {
  entries: readonly MealEntryView[];
  items: readonly CatalogItem[];
  recent: Record<Meal, readonly CatalogItem[]>;
  onAdd: (meal: AddMeal) => void;
  onDelete: (id: string) => void;
  /** Household units per food, for "Create dish" (F07). */
  units: Record<string, { label: string; grams: number }[]>;
  /** Saves the new dish and logs one serving of it in that meal (F07). */
  onCreateDish: (meal: Meal, dish: NewDish) => void;
  /** Nutrients, source and ingredients of a dish or food (F06). */
  loadDetail: (item: CatalogItem) => Promise<ItemDetail>;
}

type SheetState =
  | { kind: 'pick'; meal: Meal; query: string }
  | { kind: 'portion'; meal: Meal; query: string; item: CatalogItem; portion: Portion }
  | { kind: 'entry'; entry: MealEntryView }
  | { kind: 'create'; meal: Meal; name: string }
  | {
      kind: 'detail';
      back: Extract<SheetState, { kind: 'portion' }>;
      detail: ItemDetail | null;
    };

/** The four meals of the day with their chips, and the add flow: pick a dish → portion (F05). */
export function MealsSection({
  entries,
  items,
  recent,
  onAdd,
  onDelete,
  units,
  onCreateDish,
  loadDetail,
}: Props) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const mealName = (meal: Meal) => t(`meals.slots.${meal}`);
  const chipLabel = (e: MealEntryView) =>
    e.servings !== null
      ? `${fractionLabel(e.servings)} ${e.name}`
      : `${formatNumber(e.grams ?? 0)} g ${e.name}`;

  let title: string | null = null;
  let body = null;
  let footer = null;
  if (sheet?.kind === 'pick') {
    title = mealName(sheet.meal);
    body = (
      <DishPicker
        query={sheet.query}
        onQuery={(query) => setSheet({ ...sheet, query })}
        recent={recent[sheet.meal]}
        items={items}
        onPick={(item) =>
          setSheet({
            kind: 'portion',
            meal: sheet.meal,
            query: sheet.query,
            item,
            portion: { servings: 1, grams: '', saveRest: false },
          })
        }
        onCreate={(name) => setSheet({ kind: 'create', meal: sheet.meal, name })}
      />
    );
  } else if (sheet?.kind === 'create') {
    const { meal, name } = sheet;
    title = t('dish.title');
    body = (
      <CreateDish
        initialName={name}
        foods={items.filter((i) => i.kind === 'food')}
        units={units}
        onSave={(dish) => {
          onCreateDish(meal, dish);
          setSheet(null);
        }}
      />
    );
    footer = <View />;
  } else if (sheet?.kind === 'portion') {
    const { meal, query, item, portion } = sheet;
    title = t('meals.howMuch');
    const back = (
      <Button
        variant="link"
        label={query.trim() ? t('meals.backToResults', { query: query.trim() }) : t('meals.backToPick')}
        onPress={() => setSheet({ kind: 'pick', meal, query })}
      />
    );
    body = (
      <PortionPicker
        item={item}
        portion={portion}
        onChange={(next) => setSheet({ ...sheet, portion: next })}
      />
    );
    const portionSheet = sheet;
    const openDetail = () => {
      setSheet({ kind: 'detail', back: portionSheet, detail: null });
      void loadDetail(item).then((detail) =>
        setSheet((current) =>
          current?.kind === 'detail' && current.back === portionSheet
            ? { ...current, detail }
            : current,
        ),
      );
    };
    body = (
      <>
        {back}
        {body}
        <Button variant="link" label={t('detail.open')} onPress={openDetail} />
      </>
    );
    const grams = portion.grams ? Number(portion.grams) : null;
    footer = (
      <Button
        label={
          grams !== null
            ? t('meals.addGrams', { grams })
            : t('meals.addServings', { portion: fractionLabel(portion.servings) })
        }
        onPress={() => {
          onAdd({
            meal,
            item,
            ...(grams !== null ? { grams } : { servings: portion.servings }),
            saveRestForTomorrow: portion.saveRest && eatenShare(item, portion) < 1,
          });
          setSheet(null);
        }}
      />
    );
  } else if (sheet?.kind === 'detail') {
    const { back, detail } = sheet;
    title = back.item.name;
    body = detail ? <ItemDetailView detail={detail} /> : null;
    footer = <Button variant="secondary" label={t('detail.back')} onPress={() => setSheet(back)} />;
  } else if (sheet?.kind === 'entry') {
    const { entry } = sheet;
    title = chipLabel(entry);
    body = (
      <>
        <Text style={[type.body, styles.ink]}>
          {t('meals.entryKcal', { kcal: formatNumber(entry.kcal), meal: mealName(entry.meal) })}
        </Text>
        {entry.leftoverOf ? (
          <Text style={[type.caption, styles.muted]}>{t('meals.leftover')}</Text>
        ) : null}
      </>
    );
    footer = (
      <Button
        variant="secondary"
        label={t('meals.remove')}
        onPress={() => {
          onDelete(entry.id);
          setSheet(null);
        }}
      />
    );
  }

  return (
    <Card title={t('meals.title')}>
      {MEALS.map((meal) => {
        const own = entries.filter((e) => e.meal === meal);
        const kcal = own.reduce((sum, e) => sum + e.kcal, 0);
        return (
          <View key={meal} style={styles.slot}>
            <View style={styles.head}>
              <Text style={[type.heading, styles.ink, styles.grow]}>{mealName(meal)}</Text>
              {own.length ? (
                <Text style={[type.label, styles.muted]}>
                  {t('meals.kcal', { kcal: formatNumber(kcal) })}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('meals.addTo', { meal: mealName(meal) })}
                onPress={() => setSheet({ kind: 'pick', meal, query: '' })}
                style={styles.plus}
              >
                <Text style={[type.title, styles.onAccent]}>+</Text>
              </Pressable>
            </View>
            {own.length ? (
              <View style={styles.chips}>
                {own.map((entry) => (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    accessibilityLabel={chipLabel(entry)}
                    onPress={() => setSheet({ kind: 'entry', entry })}
                    style={styles.chip}
                  >
                    <FoodIcon icon={entry.icon} size={30} />
                    <Text numberOfLines={1} style={[type.label, styles.ink]}>
                      {chipLabel(entry)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
      <Sheet title={title} onDone={() => setSheet(null)} footer={footer}>
        {body}
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  slot: { gap: space.sm, paddingVertical: space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  plus: {
    width: touch,
    height: touch,
    borderRadius: radius.pill,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onAccent: { color: color.onDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: color.green50,
    borderRadius: radius.pill,
    paddingRight: space.md,
    paddingLeft: 3,
    minHeight: 36,
    maxWidth: '100%',
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
