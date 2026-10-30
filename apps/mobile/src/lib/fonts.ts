import { Figtree_700Bold } from '@expo-google-fonts/figtree';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';

/**
 * Loads the Amanecer fonts that the APK does not embed (Figtree 400 and 600 are embedded, app.config.ts). They are
 * JavaScript assets, so they ship in an over-the-air update. Screens render at once; until a font is ready its
 * text uses the system font for a moment.
 */
export function useAppFonts(): void {
  useFonts({ PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, Figtree_700Bold });
}
