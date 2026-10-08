import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Segmented } from '@/components/forms/Segmented';
import { Toggle } from '@/components/forms/Toggle';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { FoodIcon } from './FoodIcon';
import type { CatalogItem } from './meals-db';
import { FRACTIONS, fractionLabel } from './portion';

export interface Portion {
  servings: number;
  /** When set, grams win over the fraction. */
  grams: string;
  saveRest: boolean;
}

/** Share of one serving the portion stands for: the fraction, or grams ÷ serving grams. */
export function eatenShare(item: CatalogItem, portion: Portion): number {
  const grams = Number(portion.grams);
  if (portion.grams && item.servingGrams) return grams / item.servingGrams;
  return portion.servings;
}

/** "How much did you eat?": ¼ … 2 servings or grams, kcal live, and "save the rest" below one serving (F05). */
export function PortionPicker({
  item,
  portion,
  onChange,
}: {
  item: CatalogItem;
  portion: Portion;
  onChange: (p: Portion) => void;
}) {
  const { t } = useTranslation();
  const share = eatenShare(item, portion);
  const kcal = (item.kcalPerServing ?? 0) * share;
  const rest = Math.round((1 - share) * 100) / 100;
  return (
    <>
      <View style={styles.preview}>
        <FoodIcon icon={item.icon} />
        <View style={styles.grow}>
          <Text style={[type.heading, styles.ink]}>{item.name}</Text>
          {item.servingGrams ? (
            <Text style={[type.caption, styles.muted]}>
              {t('meals.serving', {
                grams: formatNumber(item.servingGrams),
                kcal: formatNumber(item.kcalPerServing ?? 0),
              })}
            </Text>
          ) : null}
        </View>
        <View>
          <Text style={[type.title, styles.ink]}>{formatNumber(kcal)}</Text>
          <Text style={[type.caption, styles.muted]}>{t('profile.kcal')}</Text>
        </View>
      </View>
      <Text style={[type.label, styles.muted]}>{t('meals.fraction')}</Text>
      <Segmented
        options={FRACTIONS.map(([value, label]) => ({ value, label }))}
        value={portion.grams ? null : portion.servings}
        onChange={(servings) => onChange({ ...portion, servings, grams: '' })}
      />
      <Text style={[type.label, styles.muted]}>{t('meals.inGrams')}</Text>
      <TextInput
        accessibilityLabel={t('meals.inGrams')}
        keyboardType="number-pad"
        placeholder={item.servingGrams ? `${formatNumber(item.servingGrams)} g` : 'g'}
        placeholderTextColor={color.inkMuted}
        value={portion.grams}
        onChangeText={(text) => onChange({ ...portion, grams: text.replace(/[^0-9]/g, '') })}
        style={[type.body, styles.input]}
      />
      {share < 1 ? (
        <Toggle
          label={t('meals.saveRest', { rest: fractionLabel(rest) })}
          value={portion.saveRest}
          onChange={(saveRest) => onChange({ ...portion, saveRest })}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    padding: space.md,
  },
  grow: { flex: 1 },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    minHeight: 48,
    color: color.ink,
  },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
