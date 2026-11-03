import type { TextLogFeedback, TextLogProposal } from '@kawsay/contracts/text-log';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FoodIcon } from '@/components/data-display/FoodIcon';
import { Button } from '@/components/primitives/Button';
import { formatNumber } from '@/lib/format';
import { fractionLabel } from '@/lib/portion';
import { color, radius, space, type } from '@/lib/theme';
import type { CatalogItem, Meal } from './meals-db';
import type { TextLogEntry } from './text-log-db';

const MAX = 300;
const MEAL_ORDER: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type Portion = TextLogProposal['entries'][number]['portion'];
interface Card {
  meal: Meal;
  item: CatalogItem;
  portion: Portion;
  action: 'kept' | 'edited';
}
interface Missing {
  meal: Meal;
  text: string;
  keep: boolean;
}

type State =
  | { kind: 'idle'; error: 'offline' | 'limit' | 'other' | null }
  | { kind: 'working' }
  | {
      kind: 'proposal';
      id: string;
      cards: Card[];
      removed: string[];
      missing: Missing[];
      question: TextLogProposal['question'] | null;
    };

interface Props {
  /** Signed in: the field works; otherwise it says why not. */
  propose: ((text: string) => Promise<TextLogProposal>) | null;
  items: readonly CatalogItem[];
  units: Record<string, { label: string; grams: number }[]>;
  /** "Guardar todo": the cards and pending items to save, and the feedback for the call. */
  onSave: (
    entries: TextLogEntry[],
    pending: { meal: Meal; name: string }[],
    feedback: { id: string; feedback: TextLogFeedback },
  ) => void;
}

/** Grams of a portion in the units `addMeal` takes. */
export function toEntry(card: Card, units: Props['units']): TextLogEntry {
  const base = { meal: card.meal, item: { kind: card.item.kind, id: card.item.id } };
  const { portion } = card;
  if ('servings' in portion) return { ...base, servings: portion.servings };
  if ('grams' in portion) return { ...base, grams: portion.grams };
  const unit = units[card.item.id]?.find((u) => u.label === portion.unit);
  const grams = (unit?.grams ?? card.item.servingGrams ?? 100) * portion.count;
  return { ...base, grams };
}

/** "✍️ Escribir lo que comí" (F16): text → proposal cards → "Guardar todo". Nothing is saved before it. */
export function TextLogPanel({ propose, items, units, onSave }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle', error: null });
  const byId = new Map(items.map((i) => [`${i.kind}:${i.id}`, i]));

  const portionText = (card: Card) => {
    const p = card.portion;
    if ('servings' in p) return t('textLog.servings', { portion: fractionLabel(p.servings) });
    if ('grams' in p) return t('textLog.grams', { grams: formatNumber(p.grams) });
    return t('textLog.units', { count: p.count, unit: p.unit });
  };

  const run = () => {
    if (!propose || text.trim().length < 2) return;
    setState({ kind: 'working' });
    propose(text.trim()).then(
      (proposal) => {
        const cards = proposal.entries.flatMap((e) => {
          const item = byId.get(`${e.kind}:${e.catalogId}`);
          return item ? [{ meal: e.meal, item, portion: e.portion, action: 'kept' as const }] : [];
        });
        // An id this phone does not hold yet is a pending item, never an invented food.
        const lost = proposal.entries
          .filter((e) => !byId.has(`${e.kind}:${e.catalogId}`))
          .map((e) => ({ meal: e.meal, text: e.name, keep: true }));
        setState({
          kind: 'proposal',
          id: proposal.id,
          cards,
          removed: [],
          missing: [...proposal.unmatched.map((u) => ({ ...u, keep: true })), ...lost],
          question: proposal.question ?? null,
        });
      },
      (error: unknown) => setState({ kind: 'idle', error: textLogError(error) }),
    );
  };

  if (state.kind !== 'proposal') {
    return (
      <View style={styles.box}>
        <TextInput
          accessibilityLabel={t('textLog.field')}
          placeholder={propose ? t('textLog.placeholder') : t('textLog.offline')}
          placeholderTextColor={color.inkMuted}
          editable={propose !== null && state.kind !== 'working'}
          value={text}
          onChangeText={(value) => setText(value.slice(0, MAX))}
          multiline
          style={[type.body, styles.input]}
        />
        {state.kind === 'working' ? (
          <View style={styles.row}>
            <ActivityIndicator color={color.blue700} />
            <Text style={[type.caption, styles.muted]}>{t('textLog.working')}</Text>
          </View>
        ) : null}
        {state.kind === 'idle' && state.error ? (
          <Text style={[type.caption, styles.muted]}>{t(`textLog.errors.${state.error}`)}</Text>
        ) : null}
        {propose && text.trim().length >= 2 && state.kind !== 'working' ? (
          <Button label={t('textLog.propose')} onPress={run} />
        ) : null}
      </View>
    );
  }

  const proposal = state;
  const update = (patch: Partial<typeof proposal>) => setState({ ...proposal, ...patch });
  const cycleMeal = (meal: Meal) => MEAL_ORDER[(MEAL_ORDER.indexOf(meal) + 1) % MEAL_ORDER.length]!;
  const step = (card: Card, up: boolean): Portion => {
    const p = card.portion;
    const next = (value: number) =>
      Math.max(0.25, up ? value + (value < 1 ? 0.25 : 0.5) : value - (value <= 1 ? 0.25 : 0.5));
    if ('servings' in p) return { servings: next(p.servings) };
    if ('grams' in p) return { grams: Math.max(10, p.grams + (up ? 50 : -50)) };
    return { unit: p.unit, count: next(p.count) };
  };

  const save = () => {
    const entries = proposal.cards.map((c) => toEntry(c, units));
    const pending = proposal.missing
      .filter((m) => m.keep)
      .map((m) => ({ meal: m.meal, name: m.text }));
    onSave(entries, pending, {
      id: proposal.id,
      feedback: {
        entries: [
          ...proposal.cards.map((c) => ({ catalogId: c.item.id, action: c.action })),
          ...proposal.removed.map((catalogId) => ({ catalogId, action: 'removed' as const })),
        ],
        unmatched: proposal.missing.map((m) => (m.keep ? 'pending' : 'removed')),
      },
    });
  };

  return (
    <View style={styles.box}>
      <Text style={[type.caption, styles.muted]}>{`“${text.trim()}”`}</Text>
      {proposal.cards.map((card, index) => (
        <View key={`${card.item.id}-${index}`} accessible={false} style={styles.card}>
          <FoodIcon icon={card.item.icon} size={36} />
          <View style={styles.grow}>
            <Text style={[type.heading, styles.ink]} numberOfLines={2}>
              {card.item.name}
            </Text>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('textLog.less', { name: card.item.name })}
                onPress={() =>
                  update({
                    cards: proposal.cards.map((c, i) =>
                      i === index ? { ...c, portion: step(c, false), action: 'edited' } : c,
                    ),
                  })
                }
                style={styles.mini}
              >
                <Text style={[type.label, styles.ink]}>−</Text>
              </Pressable>
              <Text style={[type.caption, styles.ink]}>{portionText(card)}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('textLog.more', { name: card.item.name })}
                onPress={() =>
                  update({
                    cards: proposal.cards.map((c, i) =>
                      i === index ? { ...c, portion: step(c, true), action: 'edited' } : c,
                    ),
                  })
                }
                style={styles.mini}
              >
                <Text style={[type.label, styles.ink]}>+</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('textLog.mealOf', {
                  name: card.item.name,
                  meal: t(`meals.slots.${card.meal}`),
                })}
                onPress={() =>
                  update({
                    cards: proposal.cards.map((c, i) =>
                      i === index ? { ...c, meal: cycleMeal(c.meal), action: 'edited' } : c,
                    ),
                  })
                }
                style={styles.chip}
              >
                <Text style={[type.label, styles.ink]}>{t(`meals.slots.${card.meal}`)}</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dish.remove', { name: card.item.name })}
            onPress={() =>
              update({
                cards: proposal.cards.filter((_, i) => i !== index),
                removed: [...proposal.removed, card.item.id],
              })
            }
            style={styles.remove}
          >
            <Text style={[type.title, styles.muted]}>×</Text>
          </Pressable>
        </View>
      ))}
      {proposal.question ? (
        <View style={styles.question}>
          <Text style={[type.label, styles.ink]}>{proposal.question.text}</Text>
          <View style={styles.row}>
            {proposal.question.options.map((option) => (
              <Pressable
                key={option.catalogId}
                accessibilityRole="button"
                onPress={() => {
                  const item = byId.get(`${option.kind}:${option.catalogId}`);
                  const replaces = proposal.question!.replaces;
                  update({
                    question: null,
                    cards: proposal.cards.map((c) =>
                      item && c.item.id === replaces && item.id !== replaces
                        ? { ...c, item, action: 'edited' }
                        : c,
                    ),
                  });
                }}
                style={styles.chip}
              >
                <Text style={[type.label, styles.ink]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {proposal.missing.map((m, index) => (
        <View key={`${m.text}-${index}`} style={[styles.card, styles.pending]}>
          <View style={styles.grow}>
            <Text style={[type.heading, styles.peach]}>{m.text}</Text>
            <Text style={[type.caption, styles.peach]}>
              {m.keep ? t('textLog.pendingOn') : t('textLog.pendingOff')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: m.keep }}
            accessibilityLabel={t('textLog.keepPending', { name: m.text })}
            onPress={() =>
              update({
                missing: proposal.missing.map((x, i) =>
                  i === index ? { ...x, keep: !x.keep } : x,
                ),
              })
            }
            style={styles.chip}
          >
            <Text style={[type.label, styles.ink]}>{m.keep ? '✓' : '—'}</Text>
          </Pressable>
        </View>
      ))}
      {proposal.cards.length === 0 && proposal.missing.length === 0 ? (
        <Text style={[type.body, styles.muted]}>{t('textLog.empty')}</Text>
      ) : null}
      <Button
        label={t('textLog.saveAll')}
        disabled={proposal.cards.length === 0 && !proposal.missing.some((m) => m.keep)}
        onPress={save}
      />
      <Button
        variant="secondary"
        label={t('textLog.again')}
        onPress={() => setState({ kind: 'idle', error: null })}
      />
    </View>
  );
}

/** Why a proposal failed: no signal, the daily limit, anything else. */
function textLogError(error: unknown): 'offline' | 'limit' | 'other' {
  if (error instanceof TypeError) return 'offline';
  if ((error as { code?: string } | null)?.code === 'ai.text_log_limit') return 'limit';
  return 'other';
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: color.ink,
    backgroundColor: color.card,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.inner,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  pending: { borderStyle: 'dashed', borderColor: color.peach800, backgroundColor: color.peach50 },
  question: {
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.inner,
    backgroundColor: color.blue50,
  },
  grow: { flex: 1, gap: 2 },
  mini: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.chip,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.chip,
  },
  remove: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
  peach: { color: color.peach800 },
});
