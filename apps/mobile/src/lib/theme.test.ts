import { PILL } from '@/components/data-display/Pill';
import { color } from './theme';

/** WCAG 2.x contrast ratio of two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Every text colour on every background it is used on (tokens.md). Zone colours (`*300`) are never text. */
const PAIRS: [string, string, string][] = [
  ['ink on card', color.ink, color.card],
  ['ink on gradient top', color.ink, color.gradient[0]],
  ['ink on gradient bottom', color.ink, color.gradient[3]],
  ['ink-soft on gradient top', color.inkSoft, color.gradient[0]],
  ['ink-soft on gradient bottom', color.inkSoft, color.gradient[3]],
  ['ink-soft on surface-2', color.inkSoft, color.surface2],
  ['ink-muted on card', color.inkMuted, color.card],
  ['ink-muted on surface-2', color.inkMuted, color.surface2],
  ['ink on chip', color.ink, color.chip],
  ['white on blue-700 (primary button)', color.white, color.blue700],
  ['blue-700 on card (links, secondary button)', color.blue700, color.card],
  ['peach-800 on peach-50 (pending chip)', color.peach800, color.peach50],
  ...Object.entries(PILL).map(
    ([tone, { ink, bg }]) => [`${tone} pill`, ink, bg] as [string, string, string],
  ),
];

describe('Amanecer tokens (design M3)', () => {
  it.each(PAIRS)('%s reaches 4.5:1', (_name, text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('ink-muted on the top of the gradient fails, so it is kept off the gradient', () => {
    expect(contrast(color.inkMuted, color.gradient[0])).toBeLessThan(4.5);
  });
});
