import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, radius, space, type } from '@/lib/theme';
import { Button } from '@/components/primitives/Button';

interface Props {
  title: string | null;
  onDone: () => void;
  children: ReactNode;
  /** Replaces the default "Done" button, e.g. with "Add ½ serving". */
  footer?: ReactNode;
}

/** Height of the on-screen keyboard, 0 while hidden. A modal window is not resized by Android, so it asks. */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', (event) => setHeight(event.endCoordinates.height)),
      Keyboard.addListener('keyboardDidHide', () => setHeight(0)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);
  return height;
}

/**
 * A sheet over a screen with its content and a footer action. Hidden when `title` is null. It sits above the
 * keyboard, so what is typed and its results stay visible; tapping outside closes it like the back button.
 */
export function Sheet({ title, onDone, children, footer }: Props) {
  const { t } = useTranslation();
  const keyboard = useKeyboardHeight();
  const { height: screen } = useWindowDimensions();
  return (
    <Modal visible={title !== null} animationType="slide" transparent onRequestClose={onDone}>
      <View style={[styles.scrim, { paddingBottom: keyboard }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onDone}
          style={styles.outside}
        />
        <SafeAreaView
          edges={keyboard > 0 ? [] : ['bottom']}
          style={[styles.sheet, { maxHeight: (screen - keyboard) * 0.9 }]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text accessibilityRole="header" style={[type.title, styles.ink]}>
              {title}
            </Text>
            {children}
          </ScrollView>
          <View style={styles.footer}>
            {footer ?? <Button label={t('common.done')} onPress={onDone} />}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,31,26,0.4)' },
  outside: { flex: 1 },
  sheet: {
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.card + 6,
    borderTopRightRadius: radius.card + 6,
  },
  content: { padding: space.lg, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  ink: { color: color.ink },
});
