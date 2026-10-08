import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Reloads a screen's data when its tab comes back into view, so a change made elsewhere (an edited past day, a new
 * profile) shows without restarting. The first focus is skipped: `useLoad` already loaded.
 */
export function useReloadOnFocus(reload: () => void): void {
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reload();
    }, [reload]),
  );
}
