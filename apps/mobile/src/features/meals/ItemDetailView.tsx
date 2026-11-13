import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber, formatShortDate } from '@/lib/format';
import { color, space, type } from '@/lib/theme';
import { DETAIL_NUTRIENTS, type ItemDetail, type Source } from './catalog-detail';

/** Where the numbers come from and what the dish is made of (F06); an unknown value reads "sin dato", never 0. */
export function ItemDetailView({ detail }: { detail: ItemDetail }) {
  const { t } = useTranslation();
  const sourceName = (source: Source) =>
    source.code
      ? `${t(`detail.sources.${source.kind}`)} · ${
          // A label food's code is the day its label was entered (F23 piece 3).
          source.kind === 'label' ? formatShortDate(source.code) : source.code
        }`
      : t(`detail.sources.${source.kind}`);

  return (
    <View style={styles.box}>
      <Text style={[type.body, styles.muted]}>
        {t('detail.source', { source: sourceName(detail.source) })}
      </Text>
      <Text style={[type.heading, styles.ink]}>
        {detail.servingGrams !== null
          ? t('detail.perServing', { grams: formatNumber(detail.servingGrams) })
          : t('detail.per100g')}
      </Text>
      {DETAIL_NUTRIENTS.map((key) => {
        const value = detail.perServing[key];
        const coverage = detail.coverage[key];
        // Iron is read in tenths of a milligram; kcal and the other minerals in whole units.
        const decimals = key === 'ironMg' || key.endsWith('G') ? 1 : 0;
        return (
          <View key={key} style={styles.row}>
            <Text style={[type.body, styles.ink]}>{t(`detail.nutrients.${key}`)}</Text>
            <View style={styles.value}>
              <Text style={[type.label, value === null ? styles.muted : styles.ink]}>
                {value === null
                  ? t('detail.noData')
                  : `${formatNumber(value, decimals)} ${t(`detail.units.${key}`)}`}
              </Text>
              {value !== null && coverage < 1 ? (
                <Text style={[type.caption, styles.muted]}>
                  {t('detail.partial', { percent: formatNumber(coverage * 100) })}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
      {detail.ingredients.length > 0 ? (
        <>
          <Text style={[type.heading, styles.ink]}>{t('detail.ingredients')}</Text>
          {detail.ingredients.map((ingredient, index) => (
            <View key={`${ingredient.name}-${index}`} style={styles.ingredient}>
              <Text style={[type.body, styles.ink]}>
                {`${ingredient.name} · ${formatNumber(ingredient.grams)} g`}
              </Text>
              <Text style={[type.caption, styles.muted]}>{sourceName(ingredient.source)}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: color.line,
    paddingVertical: space.xs,
  },
  value: { alignItems: 'flex-end', flexShrink: 1 },
  ingredient: { paddingVertical: space.xs },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
