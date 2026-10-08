import { useCallback, useEffect, useState } from 'react';

export interface Loaded<T> {
  /** undefined until the first load finishes. */
  data: T | undefined;
  error: Error | null;
  reload: () => void;
}

/**
 * Runs an async read and keeps its result; `reload()` runs it again (after a save). A result that arrives after
 * the screen unmounted, or after a newer load started, is dropped. `load` must be stable (useCallback).
 */
export function useLoad<T>(load: () => Promise<T>): Loaded<T> {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ data: T | undefined; error: Error | null }>({
    data: undefined,
    error: null,
  });
  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setResult({ data, error: null }),
      (error: unknown) =>
        current &&
        setResult({
          data: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      current = false;
    };
  }, [load, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...result, reload };
}
