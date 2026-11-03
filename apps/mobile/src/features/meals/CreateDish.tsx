import { recipeTotals } from '@kawsay/core/food/recipe-totals';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stepper } from '@/components/forms/Stepper';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, touch, type } from '@/lib/theme';
import { FOOD_ICONS, FoodIcon } from '@/components/data-display/FoodIcon';
import type { CatalogItem, NewDish } from './meals-db';
import { FRACTIONS, fractionLabel } from '@/lib/portion';
import { searchCatalog } from '@kawsay/core/food/search';

type Unit = { label: string; grams: number };

interface Ingredient {
  food: CatalogItem;
  /** null: entered in grams. */
  unit: Unit | null;
  count: number;
  grams: string;
}

interface Props {
  /** Prefilled from the search text. */
  initialName: string;
  /** Catalog foods (not dishes). */
  foods: readonly CatalogItem[];
  units: Record<string, Unit[]>;
  onSave: (dish: NewDish) => void;
  /** An AI proposal to start from (F07 v0.2): catalog ids and grams; every number comes from the table. */
  proposal?: {
    icon: string;
    servings: number;
    items: readonly { food: string; grams: number }[];
  } | null;
  /** "✨ Completar con IA": ingredients and grams for the typed name; absent without an account. */
  propose?: (name: string) => Promise<NonNullable<Props['proposal']>>;
}

type Mode =
  { kind: 'list' } | { kind: 'search'; query: string } | { kind: 'amount'; index: number };

const KEYS = ['energyKcal', 'proteinG', 'fatG', 'carbsTotalG'] as const;
const RESULTS = 20;

const SOURCES = ['INS', 'USDA', 'label', 'none'] as const;
/** Where an ingredient's numbers come from, shown on an AI proposal (F07: each ingredient with its source). */
const sourceKey = (source: string) =>
  (SOURCES as readonly string[]).includes(source) ? (source as (typeof SOURCES)[number]) : 'none';

const gramsOf = (i: Ingredient) => (i.unit ? i.unit.grams * i.count : Number(i.grams) || 0);
const kcalOf = (i: Ingredient) => ((i.food.per100g?.energyKcal ?? 0) * gramsOf(i)) / 100;

/** Create dish, manual (F07 v0.1): name, icon, servings it yields, catalog foods in household units or grams. */
export function CreateDish({
  initialName,
  foods,
  units,
  onSave,
  proposal: initialProposal = null,
  propose,
}: Props) {
  const [proposal, setProposal] = useState(initialProposal);
  const [asking, setAsking] = useState<'idle' | 'working' | 'failed'>('idle');
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(proposal?.icon ?? 'plato');
  const [servings, setServings] = useState(Math.max(1, Math.round(proposal?.servings ?? 1)));
  const fromProposal = (p: NonNullable<Props['proposal']> | null): Ingredient[] =>
    (p?.items ?? []).flatMap((item) => {
      const found = foods.find((f) => f.id === item.food);
      return found
        ? [{ food: found, unit: null, count: 1, grams: String(Math.round(item.grams)) }]
        : [];
    });
  const [items, setItems] = useState<Ingredient[]>(() => fromProposal(initialProposal));
  const askAi = () => {
    if (!propose || !name.trim()) return;
    setAsking('working');
    propose(name.trim()).then(
      (p) => {
        setProposal(p);
        setIcon(p.icon);
        setServings(Math.max(1, Math.round(p.servings)));
        setItems(fromProposal(p));
        setAsking('idle');
      },
      () => setAsking('failed'),
    );
  };
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  const amountLabel = (i: Ingredient) =>
    i.unit
      ? i.count === 1
        ? i.unit.label
        : `${fractionLabel(i.count)} × ${i.unit.label}`
      : t('dish.grams', { grams: formatNumber(gramsOf(i)) });
  const update = (index: number, patch: Partial<Ingredient>) =>
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const counted = items.filter((i) => gramsOf(i) > 0);
  const totals = counted.length
    ? recipeTotals(
        counted.map((i) => ({ per100g: i.food.per100g, grams: gramsOf(i) })),
        servings,
        KEYS,
      ).perServing
    : null;
  const valid = name.trim() !== '' && counted.length > 0;

  if (mode.kind === 'search') {
    const results = mode.query.trim() ? searchCatalog(mode.query, foods).slice(0, RESULTS) : [];
    return (
      <>
        <TextInput
          accessibilityLabel={t('dish.searchFood')}
          placeholder={t('dish.searchFood')}
          placeholderTextColor={color.inkMuted}
          value={mode.query}
          onChangeText={(query) => setMode({ kind: 'search', query })}
          autoFocus
          style={[type.body, styles.input]}
        />
        {results.map((food) => (
          <Pressable
            key={food.id}
            accessibilityRole="button"
            accessibilityLabel={food.name}
            onPress={() => {
              const unit = units[food.id]?.[0] ?? null;
              setItems((list) => [...list, { food, unit, count: 1, grams: unit ? '' : '100' }]);
              setMode({ kind: 'amount', index: items.length });
            }}
            style={styles.row}
          >
            <Text style={[type.heading, styles.ink]}>{food.name}</Text>
            <Text style={[type.caption, styles.muted]}>{food.source}</Text>
          </Pressable>
        ))}
        <Button variant="link" label={t('dish.back')} onPress={() => setMode({ kind: 'list' })} />
      </>
    );
  }

  if (mode.kind === 'amount') {
    const item = items[mode.index];
    if (!item) return null;
    const options = units[item.food.id] ?? [];
    return (
      <>
        <Text style={[type.title, styles.ink]}>{item.food.name}</Text>
        <View style={styles.chips}>
          {options.map((unit) => (
            <Pressable
              key={unit.label}
              accessibilityRole="button"
              accessibilityState={{ selected: item.unit?.label === unit.label }}
              onPress={() => update(mode.index, { unit })}
              style={[styles.chip, item.unit?.label === unit.label && styles.on]}
            >
              <Text style={[type.label, styles.ink]}>{unit.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.unit === null }}
            onPress={() =>
              update(mode.index, {
                unit: null,
                grams: item.grams || String(Math.round(gramsOf(item))),
              })
            }
            style={[styles.chip, item.unit === null && styles.on]}
          >
            <Text style={[type.label, styles.ink]}>{t('dish.inGrams')}</Text>
          </Pressable>
        </View>
        {item.unit ? (
          <Stepper
            label={t('dish.howMany')}
            value={fractionLabel(item.count)}
            onDecrement={() => {
              const lower = [...FRACTIONS].reverse().find(([v]) => v < item.count);
              if (lower) update(mode.index, { count: lower[0] });
            }}
            onIncrement={() => {
              const higher = FRACTIONS.find(([v]) => v > item.count);
              update(mode.index, { count: higher ? higher[0] : item.count + 1 });
            }}
          />
        ) : (
          <TextInput
            accessibilityLabel={t('dish.gramsLabel')}
            keyboardType="decimal-pad"
            value={item.grams}
            onChangeText={(grams) => update(mode.index, { grams: grams.replace(/[^\d.]/g, '') })}
            style={[type.body, styles.input]}
          />
        )}
        <Text style={[type.heading, styles.ink]}>
          {t('dish.amountKcal', { amount: amountLabel(item), kcal: formatNumber(kcalOf(item)) })}
        </Text>
        <Button label={t('dish.done')} onPress={() => setMode({ kind: 'list' })} />
      </>
    );
  }

  return (
    <>
      <TextInput
        accessibilityLabel={t('dish.name')}
        placeholder={t('dish.namePlaceholder')}
        placeholderTextColor={color.inkMuted}
        value={name}
        onChangeText={setName}
        style={[type.body, styles.input]}
      />
      {propose ? (
        <Button
          variant="secondary"
          label={asking === 'working' ? t('dish.aiWorking') : t('dish.completeWithAi')}
          disabled={!name.trim() || asking === 'working'}
          onPress={askAi}
        />
      ) : null}
      {asking === 'failed' ? (
        <Text style={[type.caption, styles.muted]}>{t('dish.aiFailed')}</Text>
      ) : null}
      <Text style={[type.label, styles.muted]}>{t('dish.icon')}</Text>
      <View style={styles.chips}>
        {FOOD_ICONS.map((name) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityLabel={t('dish.iconLabel', { name })}
            accessibilityState={{ selected: icon === name }}
            onPress={() => setIcon(name)}
            style={[styles.icon, icon === name && styles.on]}
          >
            <FoodIcon icon={name} size={36} />
          </Pressable>
        ))}
      </View>
      <Stepper
        label={t('dish.yields')}
        value={t('dish.servings', { count: servings })}
        onDecrement={() => setServings(Math.max(1, servings - 1))}
        onIncrement={() => setServings(servings + 1)}
      />
      {proposal ? <Text style={[type.caption, styles.aiNote]}>{t('dish.aiNote')}</Text> : null}
      <Text style={[type.label, styles.muted]}>{t('dish.ingredients')}</Text>
      {items.map((item, index) => (
        <View key={`${item.food.id}-${index}`} style={styles.ingredient}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.food.name}: ${amountLabel(item)}`}
            onPress={() => setMode({ kind: 'amount', index })}
            style={styles.grow}
          >
            <Text style={[type.heading, styles.ink]}>{item.food.name}</Text>
            <Text style={[type.caption, styles.muted]}>
              {`${amountLabel(item)} · ${t('dish.kcal', { kcal: formatNumber(kcalOf(item)) })}`}
              {proposal ? ` · ${t(`detail.sources.${sourceKey(item.food.source)}`)}` : ''}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dish.remove', { name: item.food.name })}
            onPress={() => setItems((list) => list.filter((_, i) => i !== index))}
            style={styles.remove}
          >
            <Text style={[type.title, styles.muted]}>×</Text>
          </Pressable>
        </View>
      ))}
      <Button
        variant="secondary"
        label={t('dish.addIngredient')}
        onPress={() => setMode({ kind: 'search', query: '' })}
      />
      {totals ? (
        <View style={styles.totals}>
          <Text style={[type.heading, styles.onDark]}>
            {t('dish.perServing', {
              kcal: formatNumber(totals.energyKcal ?? 0),
              protein: formatNumber(totals.proteinG ?? 0),
              fat: formatNumber(totals.fatG ?? 0),
              carbs: formatNumber(totals.carbsTotalG ?? 0),
            })}
          </Text>
        </View>
      ) : null}
      <Button
        label={t('dish.saveAndAdd')}
        disabled={!valid}
        onPress={() =>
          onSave({
            name: name.trim(),
            icon,
            servings,
            items: counted.map((i) => ({
              foodId: i.food.id,
              grams: gramsOf(i),
              unitLabel: i.unit?.label ?? null,
              unitCount: i.unit ? i.count : null,
            })),
          })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  aiNote: {
    color: color.peach800,
    backgroundColor: color.peach50,
    borderRadius: radius.chip,
    padding: space.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    color: color.ink,
    backgroundColor: color.card,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touch,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
  },
  icon: { padding: 2, borderRadius: radius.chip, borderWidth: 2, borderColor: 'transparent' },
  on: { borderColor: color.blue700, backgroundColor: color.blue50 },
  row: {
    minHeight: touch,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    paddingVertical: space.xs,
  },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1, minHeight: touch, justifyContent: 'center' },
  remove: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center' },
  totals: { backgroundColor: color.blue700, borderRadius: radius.card, padding: space.md },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  onDark: { color: color.white },
});
