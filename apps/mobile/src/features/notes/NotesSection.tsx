import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '@/components/feedback/Sheet';
import { Card } from '@/components/layout/Card';
import { Button } from '@/components/primitives/Button';
import { formatNumber, formatTime } from '@/lib/format';
import { color, radius, space, type } from '@/lib/theme';
import { NOTE_MAX_LENGTH, type DayNote } from './notes-db';

interface Props {
  notes: readonly DayNote[];
  onSave: (note: { id?: string; text: string }) => void;
  onDelete: (id: string) => void;
  /** Set by the (+) tab: each new value opens the editor on a new note. */
  startWriting?: string;
}

/** What is being edited: a new note (no id) or an existing one. */
type Draft = { id?: string; text: string };

/**
 * Day notes (F21): free text about health and mood. The editor is a sheet above the keyboard and its box grows
 * with the text up to a height, then scrolls, so the line being written stays in sight.
 */
export function NotesSection({ notes, onSave, onDelete, startWriting }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft | null>(startWriting ? { text: '' } : null);
  // A new request from the (+) tab opens a blank note (state adjusted while rendering, not in an effect).
  const [request, setRequest] = useState(startWriting);
  if (startWriting !== request) {
    setRequest(startWriting);
    if (startWriting) setDraft({ text: '' });
  }

  const blank = (draft?.text.trim() ?? '') === '';
  const save = () => {
    if (!draft || blank) return;
    onSave({ ...(draft.id && { id: draft.id }), text: draft.text.trim() });
    setDraft(null);
  };

  return (
    <Card title={t('notes.title')}>
      {notes.length === 0 ? (
        <Text style={[type.body, styles.muted]}>{t('notes.empty')}</Text>
      ) : (
        notes.map((note) => (
          <Pressable
            key={note.id}
            accessibilityRole="button"
            accessibilityHint={t('notes.editHint')}
            onPress={() => setDraft({ id: note.id, text: note.text })}
            style={styles.note}
          >
            <Text style={[type.caption, styles.muted]}>{formatTime(note.loggedAt, note.timeZone)}</Text>
            <Text style={[type.body, styles.ink]}>{note.text}</Text>
          </Pressable>
        ))
      )}
      <Button variant="secondary" label={t('notes.write')} onPress={() => setDraft({ text: '' })} />

      <Sheet
        title={draft ? t(draft.id ? 'notes.editTitle' : 'notes.newTitle') : null}
        onDone={() => setDraft(null)}
        footer={
          <View style={styles.actions}>
            <Button label={t('notes.save')} disabled={blank} onPress={save} />
            {draft?.id ? (
              <Button
                variant="link"
                label={t('notes.delete')}
                onPress={() => {
                  onDelete(draft.id!);
                  setDraft(null);
                }}
              />
            ) : null}
          </View>
        }
      >
        <TextInput
          accessibilityLabel={t('notes.label')}
          placeholder={t('notes.placeholder')}
          placeholderTextColor={color.inkMuted}
          value={draft?.text ?? ''}
          onChangeText={(text) => setDraft((d) => (d ? { ...d, text } : d))}
          maxLength={NOTE_MAX_LENGTH}
          multiline
          autoFocus
          scrollEnabled
          textAlignVertical="top"
          style={[type.body, styles.input]}
        />
        <Text style={[type.caption, styles.muted, styles.count]}>
          {t('notes.count', {
            count: draft?.text.length ?? 0,
            max: formatNumber(NOTE_MAX_LENGTH),
          })}
        </Text>
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  note: {
    gap: space.xs,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  actions: { gap: space.sm },
  input: {
    minHeight: 120,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.chip,
    padding: space.md,
    backgroundColor: color.surface,
    color: color.ink,
  },
  count: { textAlign: 'right' },
  ink: { color: color.ink },
  muted: { color: color.inkMuted },
});
