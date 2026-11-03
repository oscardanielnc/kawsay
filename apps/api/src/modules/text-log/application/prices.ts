import type { ModelUsage } from './ports/agent-model';

/**
 * USD per 1M tokens at peak (cached in · in · out), from api-docs.deepseek.com, checked 2026-11-03 (ADR 0023 build
 * notes). Off-peak is half. Peak: 01–04 and 06–10 UTC, Monday to Friday.
 */
export const PRICES: Record<string, { checked: string; cached: number; in: number; out: number }> =
  {
    'deepseek-flash': { checked: '2026-11-03', cached: 0.006, in: 0.3, out: 1.2 },
    'deepseek-v4-pro': { checked: '2026-11-03', cached: 0.044, in: 1.32, out: 3.96 },
  };

export function isPeak(at: Date): boolean {
  const day = at.getUTCDay();
  const hour = at.getUTCHours();
  if (day === 0 || day === 6) return false;
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

/** Cost of a call in USD; an unknown model is priced like the most expensive one, so limits stay safe. */
export function costUsd(model: string, usage: ModelUsage, at: Date): number {
  const price = PRICES[model] ?? PRICES['deepseek-v4-pro']!;
  const factor = isPeak(at) ? 1 : 0.5;
  const fresh = usage.tokensIn - usage.tokensCached;
  return (
    ((usage.tokensCached * price.cached + fresh * price.in + usage.tokensOut * price.out) *
      factor) /
    1e6
  );
}
