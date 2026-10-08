import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, radius, space, type } from '@/lib/theme';
import { Button } from './Button';

interface Props {
  title: string | null;
  onDone: () => void;
  children: ReactNode;
}

/** A sheet over the Profile with one editor and a "Done" button that saves. Hidden when `title` is null. */
export function EditSheet({ title, onDone, children }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={title !== null} animationType="slide" transparent onRequestClose={onDone}>
      <View style={styles.scrim}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={[type.title, styles.ink]}>
              {title}
            </Text>
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <Button label={t('profile.done')} onPress={onDone} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,31,26,0.4)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.card + 6,
    borderTopRightRadius: radius.card + 6,
  },
  content: { padding: space.lg, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  ink: { color: color.ink },
});
