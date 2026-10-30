import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import { CreateDish } from './CreateDish';
import { DishPicker } from './DishPicker';
import { FoodIcon } from './FoodIcon';
import type { CatalogItem, Meal, MealEntryView, NewDish } from './meals-db';
import type { PendingMeal } from './pending-db';
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
  /** The pending meal this entry completes (F23): it goes away when the entry is saved. */
  completes?: string;
}

/** Portions offered for a pending meal; the user can also type their own. */
const PENDING_PORTIONS = ['¼', '½', '1', '1½', '2'] as const;

interface Props {
  entries: readonly MealEntryView[];
  /** Meals saved by name while their food is missing (F23). */
  pending?: readonly PendingMeal[];
  onAddPending?: (pending: { meal: Meal; name: string; portion: string }) => void;
  onDeletePending?: (id: string) => void;
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
  | { kind: 'pick'; meal: Meal; query: string; completes?: PendingMeal }
  | {
      kind: 'portion';
      meal: Meal;
      query: string;
      item: CatalogItem;
      portion: Portion;
      completes?: PendingMeal;
    }
  | { kind: 'pending'; meal: Meal; name: string; portion: string }
  | { kind: 'pendingEntry'; pending: PendingMeal }
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
  pending = [],
  onAddPending,
  onDeletePending,
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
        items={items.filter((i) => !i.generic)}
        onPick={(item) =>
          setSheet({
            kind: 'portion',
            meal: sheet.meal,
            query: sheet.query,
            item,
            portion: { servings: 1, grams: '', saveRest: false },
            ...(sheet.completes && { completes: sheet.completes }),
          })
        }
        onCreate={(name) => setSheet({ kind: 'create', meal: sheet.meal, name })}
        {...(onAddPending &&
          !sheet.completes && {
            onSavePending: (name: string) =>
              setSheet({ kind: 'pending', meal: sheet.meal, name, portion: '1' }),
          })}
      />
    );
  } else if (sheet?.kind === 'pending') {
    const current = sheet;
    title = t('meals.pendingTitle');
    body = (
      <>
        <Text style={[type.caption, styles.muted]}>{t('meals.pendingHint')}</Text>
        <TextInput
          accessibilityLabel={t('meals.pendingName')}
          placeholder={t('meals.pendingName')}
          placeholderTextColor={color.inkMuted}
          value={current.name}
          onChangeText={(name) => setSheet({ ...current, name })}
          style={[type.body, styles.input]}
        />
        <Text style={[type.label, styles.muted]}>{t('meals.pendingPortion')}</Text>
        <View style={styles.chips}>
          {PENDING_PORTIONS.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={t('meals.pendingPortionLabel', { portion: p })}
              accessibilityState={{ selected: current.portion === p }}
              onPress={() => setSheet({ ...current, portion: p })}
              style={[styles.option, current.portion === p && styles.optionOn]}
            >
              <Text style={[type.heading, styles.ink]}>{p}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel={t('meals.pendingPortionFree')}
          placeholder={t('meals.pendingPortionFree')}
          placeholderTextColor={color.inkMuted}
          value={PENDING_PORTIONS.includes(current.portion as '1') ? '' : current.portion}
          onChangeText={(portion) => setSheet({ ...current, portion })}
          style={[type.body, styles.input]}
        />
      </>
    );
    footer = (
      <Button
        label={t('meals.pendingSave')}
        disabled={current.name.trim() === ''}
        onPress={() => {
          onAddPending?.({
            meal: current.meal,
            name: current.name.trim(),
            portion: current.portion,
          });
          setSheet(null);
        }}
      />
    );
  } else if (sheet?.kind === 'pendingEntry') {
    const { pending: entry } = sheet;
    title = t('meals.pendingChip', { name: entry.name });
    body = (
      <Text style={[type.body, styles.ink]}>
        {t('meals.pendingEntry', { portion: entry.portion, meal: mealName(entry.meal) })}
      </Text>
    );
    footer = (
      <View style={styles.footerRow}>
        <Button
          label={t('meals.complete')}
          onPress={() =>
            setSheet({ kind: 'pick', meal: entry.meal, query: entry.name, completes: entry })
          }
        />
        <Button
          variant="secondary"
          label={t('meals.remove')}
          onPress={() => {
            onDeletePending?.(entry.id);
            setSheet(null);
          }}
        />
      </View>
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
    const { meal, query, item, portion, completes } = sheet;
    title = t('meals.howMuch');
    const back = (
      <Button
        variant="link"
        label={
          query.trim() ? t('meals.backToResults', { query: query.trim() }) : t('meals.backToPick')
        }
        onPress={() => setSheet({ kind: 'pick', meal, query, ...(completes && { completes }) })}
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
            ...(completes && { completes: completes.id }),
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
        const waiting = pending.filter((p) => p.meal === meal);
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
            {own.length || waiting.length ? (
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
                {waiting.map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('meals.pendingChip', { name: p.name })}
                    onPress={() => setSheet({ kind: 'pendingEntry', pending: p })}
                    style={[styles.chip, styles.pendingChip]}
                  >
                    <Text numberOfLines={1} style={[type.label, styles.pendingInk]}>
                      {t('meals.pendingChip', { name: p.name })}
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
    backgroundColor: color.blue700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onAccent: { color: color.white },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: color.blue50,
    borderRadius: radius.pill,
    paddingRight: space.md,
    paddingLeft: 3,
    minHeight: 36,
    maxWidth: '100%',
  },
  pendingChip: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.peach300,
    backgroundColor: color.peach50,
    paddingLeft: space.md,
  },
  pendingInk: { color: color.peach800 },
  input: {
    backgroundColor: color.card,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    minHeight: 48,
    color: color.ink,
  },
  option: {
    minWidth: touch + 8,
    minHeight: touch,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
  },
  optionOn: { borderColor: color.blue700, backgroundColor: color.blue50 },
  footerRow: { gap: space.sm },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
