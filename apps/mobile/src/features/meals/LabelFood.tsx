import type { LabelReading } from '@kawsay/contracts/catalog';
import {
  energyGap,
  LABEL_NUTRIENTS,
  labelPer100g,
  type LabelNutrient,
} from '@kawsay/core/food/label-per-100g';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Segmented } from '@/components/forms/Segmented';
import { Toggle } from '@/components/forms/Toggle';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import type { NewUserFood } from './user-food-db';

/** A photo ready to send: shrunk JPEG in base64. */
export interface LabelPhoto {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

interface Props {
  /** Prefilled from the search text. */
  initialName: string;
  /** Opens the camera or the gallery; null when the user cancels. Absent where the phone cannot take photos. */
  takePhoto?: (from: 'camera' | 'library') => Promise<LabelPhoto | null>;
  /** The API reads the label (ADR 0029); absent without an account. */
  readLabel?: (photo: LabelPhoto) => Promise<LabelReading>;
  onSave: (food: Omit<NewUserFood, 'labelDate'>) => void;
}

type Fields = Record<LabelNutrient, string>;
type Status = 'idle' | 'reading' | 'read' | 'unreadable' | 'offline' | 'limit' | 'failed';

/** Printed energy this far from its macronutrients gets a warning: likely a misread column or decimal. */
const GAP_WARNING = 0.2;
const UNITS: Record<LabelNutrient, string> = {
  energyKcal: 'kcal',
  fatG: 'g',
  saturatedFatG: 'g',
  transFatG: 'g',
  cholesterolMg: 'mg',
  sodiumMg: 'mg',
  carbsTotalG: 'g',
  fiberG: 'g',
  sugarsTotalG: 'g',
  addedSugarG: 'g',
  proteinG: 'g',
};

const EMPTY = Object.fromEntries(LABEL_NUTRIENTS.map((k) => [k, ''])) as Fields;

/** "1,5" and "1.5" are both 1.5; empty or unreadable is null ("sin dato"), never 0. */
export function parseAmount(text: string): number | null {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  const value = Number(clean);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

const show = (n: number | null) => (n === null ? '' : String(Math.round(n * 100) / 100));

function errorKind(error: unknown): Status {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'catalog.label_limit') return 'limit';
  if (error instanceof TypeError) return 'offline';
  return 'failed';
}

/**
 * Own food from a label (F23 piece 3): a photo read by the API fills the form, or the user types it. Every number
 * stays editable and nothing is saved until the user confirms; the AI reads, never invents (ADR 0029).
 */
export function LabelFood({ initialName, takePhoto, readLabel, onSave }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState('');
  const [basis, setBasis] = useState<'per100g' | 'perServing'>('perServing');
  const [servingLabel, setServingLabel] = useState('');
  const [servingGrams, setServingGrams] = useState('');
  const [packageGrams, setPackageGrams] = useState('');
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [isDrink, setIsDrink] = useState(false);
  const [refinedFlour, setRefinedFlour] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  const values = Object.fromEntries(
    LABEL_NUTRIENTS.map((k) => [k, parseAmount(fields[k])]),
  ) as Record<LabelNutrient, number | null>;
  const serving = parseAmount(servingGrams);
  const needsServing = basis === 'perServing' && !(serving && serving > 0);
  const per100g = needsServing
    ? null
    : labelPer100g({ basis, servingGrams: serving, values, refinedFlour });
  const gap = per100g ? energyGap(per100g) : null;
  const canSave = name.trim() !== '' && values.energyKcal !== null && !needsServing;
  const unit = isDrink ? 'ml' : 'g';

  const apply = (reading: LabelReading) => {
    if (!reading.readable) {
      setStatus('unreadable');
      return;
    }
    if (reading.name && !name.trim()) setName(reading.name);
    if (reading.brand) setBrand(reading.brand);
    setBasis(reading.basis);
    setServingLabel(reading.servingLabel ?? '');
    setServingGrams(show(reading.servingGrams));
    setPackageGrams(show(reading.packageGrams));
    setFields(
      Object.fromEntries(LABEL_NUTRIENTS.map((k) => [k, show(reading.values[k])])) as Fields,
    );
    setIsDrink(reading.isDrink);
    setRefinedFlour(reading.refinedFlour);
    setStatus('read');
  };

  const photo = async (from: 'camera' | 'library') => {
    if (!takePhoto || !readLabel) return;
    const image = await takePhoto(from).catch(() => null);
    if (!image) return;
    setStatus('reading');
    readLabel(image).then(apply, (error: unknown) => setStatus(errorKind(error)));
  };

  const field = (key: LabelNutrient) => (
    <View key={key} style={styles.row}>
      <Text style={[type.body, styles.ink, styles.rowLabel]}>{t(`label.nutrients.${key}`)}</Text>
      <TextInput
        accessibilityLabel={t(`label.nutrients.${key}`)}
        keyboardType="decimal-pad"
        placeholder={t('label.noData')}
        placeholderTextColor={color.inkMuted}
        value={fields[key]}
        onChangeText={(text) => setFields((f) => ({ ...f, [key]: text }))}
        style={[type.body, styles.input, styles.number]}
      />
      <Text style={[type.caption, styles.muted, styles.unit]}>{UNITS[key]}</Text>
    </View>
  );

  return (
    <View style={styles.box}>
      {takePhoto && readLabel ? (
        <View style={styles.actions}>
          <Text style={[type.caption, styles.muted]}>{t('label.photoHint')}</Text>
          <View style={styles.buttons}>
            <Button label={t('label.camera')} onPress={() => void photo('camera')} />
            <Button
              variant="secondary"
              label={t('label.library')}
              onPress={() => void photo('library')}
            />
          </View>
        </View>
      ) : (
        <Text style={[type.caption, styles.muted]}>{t('label.typeHint')}</Text>
      )}
      {status === 'reading' ? (
        <View style={styles.status}>
          <ActivityIndicator color={color.blue700} />
          <Text style={[type.body, styles.ink]}>{t('label.reading')}</Text>
        </View>
      ) : status !== 'idle' ? (
        <Text style={[type.body, status === 'read' ? styles.note : styles.warning]}>
          {t(`label.status.${status}`)}
        </Text>
      ) : null}

      <TextInput
        accessibilityLabel={t('label.name')}
        placeholder={t('label.name')}
        placeholderTextColor={color.inkMuted}
        value={name}
        onChangeText={setName}
        style={[type.body, styles.input]}
      />
      <TextInput
        accessibilityLabel={t('label.brand')}
        placeholder={t('label.brand')}
        placeholderTextColor={color.inkMuted}
        value={brand}
        onChangeText={setBrand}
        style={[type.body, styles.input]}
      />

      <Text style={[type.label, styles.muted]}>{t('label.basis')}</Text>
      <Segmented
        options={[
          { value: 'perServing', label: t('label.perServing') },
          { value: 'per100g', label: t(isDrink ? 'label.per100ml' : 'label.per100g') },
        ]}
        value={basis}
        onChange={setBasis}
      />
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={t('label.servingLabel')}
          placeholder={t('label.servingLabel')}
          placeholderTextColor={color.inkMuted}
          value={servingLabel}
          onChangeText={setServingLabel}
          style={[type.body, styles.input, styles.grow]}
        />
        <TextInput
          accessibilityLabel={t('label.servingGrams', { unit })}
          keyboardType="decimal-pad"
          placeholder={unit}
          placeholderTextColor={color.inkMuted}
          value={servingGrams}
          onChangeText={setServingGrams}
          style={[type.body, styles.input, styles.number]}
        />
      </View>
      {needsServing ? (
        <Text style={[type.caption, styles.warning]}>{t('label.needsServing')}</Text>
      ) : null}
      <View style={styles.row}>
        <Text style={[type.body, styles.ink, styles.rowLabel]}>{t('label.package')}</Text>
        <TextInput
          accessibilityLabel={t('label.packageGrams', { unit })}
          keyboardType="decimal-pad"
          placeholder={t('label.noData')}
          placeholderTextColor={color.inkMuted}
          value={packageGrams}
          onChangeText={setPackageGrams}
          style={[type.body, styles.input, styles.number]}
        />
        <Text style={[type.caption, styles.muted, styles.unit]}>{unit}</Text>
      </View>

      <Text style={[type.label, styles.muted]}>
        {basis === 'perServing'
          ? t('label.valuesPerServing')
          : t(isDrink ? 'label.valuesPer100ml' : 'label.valuesPer100g')}
      </Text>
      {LABEL_NUTRIENTS.map(field)}
      {values.addedSugarG === null && values.sugarsTotalG !== null ? (
        <Button
          variant="link"
          label={t('label.useTotalSugars')}
          onPress={() => setFields((f) => ({ ...f, addedSugarG: f.sugarsTotalG }))}
        />
      ) : null}

      <Toggle label={t('label.isDrink')} value={isDrink} onChange={setIsDrink} />
      <Toggle
        label={t('label.refinedFlour')}
        description={t('label.refinedFlourHint')}
        value={refinedFlour}
        onChange={setRefinedFlour}
      />

      {per100g?.energyKcal != null ? (
        <Text style={[type.body, styles.ink]}>
          {t(isDrink ? 'label.resultMl' : 'label.result', {
            kcal: formatNumber(per100g.energyKcal),
          })}
        </Text>
      ) : null}
      {gap !== null && gap > GAP_WARNING ? (
        <Text style={[type.body, styles.warning]}>{t('label.energyGap')}</Text>
      ) : null}

      <Button
        label={t('label.save')}
        disabled={!canSave || status === 'reading'}
        onPress={() =>
          onSave({
            name: name.trim(),
            brand: brand.trim() || null,
            label: { basis, servingGrams: serving, values, refinedFlour },
            servingLabel: servingLabel.trim() || null,
            packageGrams: parseAmount(packageGrams),
            isDrink,
            readByAi: status === 'read',
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  actions: { gap: space.xs },
  buttons: { gap: space.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowLabel: { flex: 1 },
  grow: { flex: 1 },
  input: {
    backgroundColor: color.card,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    minHeight: 48,
    color: color.ink,
  },
  number: { width: 96, textAlign: 'right' },
  unit: { width: 32 },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  note: { color: color.blue700 },
  warning: { color: color.peach800 },
});
