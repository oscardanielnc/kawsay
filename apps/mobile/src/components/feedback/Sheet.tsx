import { useEffect, useRef, useState, type ReactNode } from 'react';
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

/**
 * Height of the on-screen keyboard, 0 while hidden. A modal window is not resized by Android, so it asks. While a
 * finger is down the sheet keeps its place: if the keyboard hides under a tap, the sheet only moves after the
 * finger lifts, so the tap lands on the result it started on (F05, "one tap picks a result").
 */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  const touching = useRef(false);
  const pending = useRef<number | null>(null);
  useEffect(() => {
    const apply = (next: number) => {
      if (touching.current) pending.current = next;
      else setHeight(next);
    };
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', (event) => apply(event.endCoordinates.height)),
      Keyboard.addListener('keyboardDidHide', () => apply(0)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);
  const touch = {
    onTouchStart: () => {
      touching.current = true;
    },
    onTouchEnd: () => {
      touching.current = false;
      const next = pending.current;
      pending.current = null;
      // After the press has fired, so the layout change cannot cancel it.
      if (next !== null) setTimeout(() => setHeight(next), 0);
    },
  };
  return { height, touch };
}

/**
 * A sheet over a screen with its content and a footer action. Hidden when `title` is null. It sits above the
 * keyboard, so what is typed and its results stay visible; tapping outside closes it like the back button.
 */
export function Sheet({ title, onDone, children, footer }: Props) {
  const { t } = useTranslation();
  const { height: keyboard, touch } = useKeyboardHeight();
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
          {...touch}
          onTouchCancel={touch.onTouchEnd}
          edges={keyboard > 0 ? [] : ['bottom']}
          style={[styles.sheet, { maxHeight: (screen - keyboard) * 0.9 }]}
        >
          <View style={styles.grabber} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.scrim },
  outside: { flex: 1 },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: color.line,
    marginTop: space.sm,
  },
  content: { padding: space.lg, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  ink: { color: color.ink },
});
