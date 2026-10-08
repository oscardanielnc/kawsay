/** Design tokens from docs/design/tokens.md (P1 "Selva", T2 type). Moves to packages/ui when it exists. */
export const color = {
  bg: '#F6F2E8',
  surface: '#FFFFFF',
  ink: '#1C1F1A',
  inkMuted: '#5E6358',
  line: '#E4DED1',
  brand: '#1F4D3A',
  accent: '#B84E18',
  green50: '#EEF6F0',
  green100: '#D5EBDB',
  rangeGreen: '#86C497',
  successText: '#255E3B',
  rangeYellow: '#EBC867',
  warningText: '#9A6B00',
  rangeRed: '#E58B7A',
  dangerText: '#B3392F',
  noData: '#B9B6AE',
  onDark: '#FFFFFF',
} as const;

/** Embedded font files (expo-font plugin): on Android the family is the file name. */
export const font = {
  title: 'BricolageGrotesque_700Bold',
  heading: 'BricolageGrotesque_600SemiBold',
  body: 'Figtree_400Regular',
  label: 'Figtree_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: font.title, fontSize: 32, lineHeight: 36 },
  title: { fontFamily: font.title, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: font.heading, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.label, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 16 },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { chip: 8, card: 14, pill: 999 } as const;

/** Minimum touch target (tokens: at least 44 × 44). */
export const touch = 44;
