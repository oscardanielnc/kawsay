/**
 * Design tokens of the Amanecer redesign (docs/design/tokens.md, approved 2026-10-30). Zone colours (`*300`) are
 * never text; `src/lib/theme.test.ts` checks every text-on-background pair. Moves to packages/ui when it exists.
 */
export const color = {
  /** Screen background, top to bottom (GradientBackground). */
  gradient: ['#CFE3FA', '#E5EEFB', '#F4F0F2', '#FFE4D0'],
  /** Floating cards and sheets. */
  card: '#FFFFFF',
  ink: '#1D2B45',
  /** Text on the gradient and on tinted surfaces. */
  inkSoft: '#46597A',
  /** Secondary text, on white cards only. */
  inkMuted: '#5B6B86',
  /** Rows inside cards. */
  surface2: '#F5F8FC',
  line: '#D5E0EE',
  /** Logged-item chips. */
  chip: '#EEF3FA',
  blue50: '#E6F0FD',
  blue300: '#7FB2F0',
  blue500: '#4C8DE6',
  blue700: '#2563B8',
  blue800: '#1C4F96',
  amber50: '#FDF0DC',
  amber300: '#F6D08D',
  amber800: '#8A5300',
  coral50: '#FCE4DF',
  coral300: '#F3A99F',
  coral800: '#9E2F22',
  peach50: '#FFF1E6',
  peach300: '#FFC9A3',
  peach800: '#8A4513',
  /** "Below, the day goes on": calories under target during the day, grey and calm. */
  neutralBg: '#EEF1F6',
  /** Gauge without data yet. */
  noData: '#C9D3E1',
  /** Faces before one is picked; the label below carries the meaning. */
  faceOffFill: '#DCE2EA',
  faceOffInk: '#8D99AE',
  white: '#FFFFFF',
  /** Behind a sheet. */
  scrim: 'rgba(29,43,69,0.35)',
} as const;

/** Faces when picked, most negative first: crying red … beaming yellow. */
export const faceColor = ['#E85D4F', '#F2994A', '#F2C14E', '#F7D85C', '#FFCB2F'] as const;

/**
 * Font families. Figtree 400/600 are embedded in the APK (app.config.ts); Plus Jakarta Sans and Figtree 700 are
 * loaded at startup by `useAppFonts`, so they ship in an over-the-air update without a new APK.
 */
export const font = {
  display: 'PlusJakartaSans_800ExtraBold',
  title: 'PlusJakartaSans_700Bold',
  body: 'Figtree_400Regular',
  label: 'Figtree_600SemiBold',
  strong: 'Figtree_700Bold',
} as const;

/** Numbers line up in columns (tabular figures). */
const tabular = { fontVariant: ['tabular-nums' as const] };

export const type = {
  /** Screen titles. */
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  /** Sheet titles and big numbers. */
  title: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  /** Card titles and section headings. */
  heading: { fontFamily: font.title, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.label, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.body, fontSize: 12, lineHeight: 16 },
  /** Uppercase section labels. */
  section: {
    fontFamily: font.strong,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  /** Gauge values and other figures. */
  number: {
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    ...tabular,
  },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
/** Screen padding is 20 (Amanecer). */
export const screenPadding = 20;
/** Room under a tab's content for the floating tab bar (72 high, 24 from the bottom) plus a breath (owner). */
export const tabBarSpace = 156;
export const radius = { chip: 12, inner: 16, card: 24, pill: 999 } as const;

/** Floating card shadow: 0 10 28 rgba(38,72,128,.08). */
export const shadow = {
  shadowColor: '#264880',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 28,
  elevation: 3,
} as const;

/** Durations in ms; every animation is off with the system "reduce motion". */
export const motion = { rise: 420, needle: 380, tap: 180 } as const;

/** Minimum touch target (tokens: at least 44 × 44). */
export const touch = 44;
