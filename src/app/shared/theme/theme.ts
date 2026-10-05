/**
 * The Pockit design system, as data. This file is the one source of truth for colour, spacing,
 * radius, elevation and type.
 *
 * It has two readers, and no copy:
 *
 * - **Stylesheets** read `global.css`, which `theme-css.ts` generates from this file
 *   (`npm run theme`). `theme.test.ts` fails when the committed file is out of date.
 * - **Native chrome** (the header, the tab bar, the status bar) is configured with values and
 *   cannot read the cascade, so `app.config.ts` imports from here directly.
 *
 * Only erasable TypeScript syntax here, because `scripts/generate-theme.ts` runs under Node.
 *
 * Values come from the approved Claude Design ("Pockit · Mobile Design v1").
 */
import type { CollectionId } from '../../core/types/collection.ts';

/** Colour roles. A role is named for what it is for, never for what it looks like. */
export const palette = {
  // Surfaces, from the app ground up.
  background: '#15191B',
  surface: '#1E2427',
  surfaceElevated: '#283033',
  /** The native tab bar. */
  chrome: '#1A2023',
  divider: 'rgba(244, 238, 227, 0.08)',

  // Text, from strongest to weakest.
  textPrimary: '#F4EEE3',
  textSecondary: '#A4A9A6',
  textTertiary: '#6B7274',

  // The one accent, and the text that sits on it.
  accent: '#D8C49A',
  onAccent: '#1F1A0E',
  /** The accent as an outline: a dashed "add" tile, an outlined button. */
  accentOutline: 'rgba(216, 196, 154, 0.6)',
  /** The accent at low opacity: an icon tile that is not a collection's own, such as the add sheet. */
  accentTint: 'rgba(216, 196, 154, 0.14)',

  // Status.
  success: '#6FBF8E',
  warning: '#E6B25E',
  danger: '#E5705B',

  /** A favourited document's heart. */
  favorite: '#F08A6C',
  /** The dark chip a badge or a heart sits on, over a thumbnail. */
  overlay: 'rgba(21, 25, 27, 0.78)',
} as const;

export type ColorKey = keyof typeof palette;

/**
 * Each collection's own colour. `accent` tints its icon tile and its count; `surface`, where the
 * design gives one, is the ground of its large card. Every id must have an entry: the type says so.
 */
export const collectionPalette = {
  'personal-documents': { accent: '#9AA5F2', surface: '#232738' },
  certificates: { accent: '#E6B25E' },
  important: { accent: '#F08A6C' },
} as const satisfies Record<CollectionId, { readonly accent: string; readonly surface?: string }>;

/** How much of the accent shows in a collection's icon tile. */
export const COLLECTION_TINT_ALPHA = 0.16;

/** A 4-point grid. The screen gutter is `xl`, the gap between cards `md`, between sections `2xl`. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 } as const;

/** Corner radius. `full` is a pill or a circle, whatever the size. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 } as const;

/** Control sizes: the smallest tap target, a field or button, and the floating add button. */
export const size = { tap: 44, control: 52, fab: 56 } as const;

/** The one shadow the design uses: the floating add button. Everything else is surface contrast. */
export const shadow = { fab: '0 8px 20px rgba(0, 0, 0, 0.45)' } as const;

export const fontFamily = { sans: 'Plus Jakarta Sans', serif: 'Playfair Display' } as const;
export type FontRole = keyof typeof fontFamily;

/** The bundled faces. Native finds a face by name, so each weight is a file of its own. */
export const fontFaces = [
  { family: fontFamily.sans, weight: 400, file: 'PlusJakartaSans-Regular.ttf' },
  { family: fontFamily.sans, weight: 600, file: 'PlusJakartaSans-SemiBold.ttf' },
  { family: fontFamily.sans, weight: 700, file: 'PlusJakartaSans-Bold.ttf' },
  { family: fontFamily.serif, weight: 500, file: 'PlayfairDisplay-Medium.ttf' },
  { family: fontFamily.serif, weight: 600, italic: true, file: 'PlayfairDisplay-SemiBoldItalic.ttf' },
] as const satisfies readonly {
  readonly family: string;
  readonly weight: number;
  readonly italic?: boolean;
  readonly file: string;
}[];

/**
 * The name native knows a weight of a family by. Native finds a face by name and Ng Native 0.1.2
 * does no weight matching, so every text style and the native header and tab bar name their face
 * this way (`Plus Jakarta Sans-600`). It is how `@ng-native/expo` registers a face that declares a
 * weight, and `theme.test.ts` checks the two agree.
 */
export function nativeFontName(family: string, weight: number): string {
  return `${family}-${weight}`;
}

export interface TextStyle {
  readonly font: FontRole;
  readonly size: number;
  readonly lineHeight: number;
  readonly weight: 400 | 500 | 600 | 700;
  readonly italic?: boolean;
  readonly letterSpacing?: number;
  readonly color: ColorKey;
}

/**
 * The type scale. Each entry becomes a `.text-<name>` class that fixes family, size, line height,
 * weight and colour together, so a screen never mixes them by hand. Serif is for titles, sans for
 * everything you read or press.
 */
export const textStyles = {
  // Playfair Display
  display: { font: 'serif', size: 40, lineHeight: 46, weight: 500, color: 'textPrimary' },
  title: { font: 'serif', size: 34, lineHeight: 40, weight: 500, color: 'textPrimary' },
  heading: { font: 'serif', size: 24, lineHeight: 30, weight: 500, color: 'textPrimary' },
  'card-title': { font: 'serif', size: 22, lineHeight: 28, weight: 500, color: 'textPrimary' },
  'row-title': { font: 'serif', size: 20, lineHeight: 26, weight: 500, color: 'textPrimary' },
  wordmark: { font: 'serif', size: 20, lineHeight: 24, weight: 600, italic: true, color: 'accent' },

  // Plus Jakarta Sans
  'section-title': { font: 'sans', size: 20, lineHeight: 26, weight: 600, color: 'textPrimary' },
  'card-heading': { font: 'sans', size: 16, lineHeight: 20, weight: 600, color: 'textPrimary' },
  label: { font: 'sans', size: 15, lineHeight: 20, weight: 600, color: 'textPrimary' },
  'item-title': { font: 'sans', size: 14, lineHeight: 20, weight: 600, color: 'textPrimary' },
  body: { font: 'sans', size: 16, lineHeight: 24, weight: 400, color: 'textPrimary' },
  'body-secondary': { font: 'sans', size: 14, lineHeight: 20, weight: 400, color: 'textSecondary' },
  lead: { font: 'sans', size: 15, lineHeight: 22, weight: 400, color: 'textSecondary' },
  caption: { font: 'sans', size: 12, lineHeight: 16, weight: 400, color: 'textTertiary' },
  'caption-strong': { font: 'sans', size: 12, lineHeight: 16, weight: 600, color: 'textSecondary' },
  button: { font: 'sans', size: 16, lineHeight: 20, weight: 700, color: 'onAccent' },
  /** The small label on a thumbnail: a page count, "PDF". */
  badge: { font: 'sans', size: 10, lineHeight: 20, weight: 700, letterSpacing: 0.4, color: 'textPrimary' },
  /** A group's spaced-caps heading above its rows, in Settings. */
  eyebrow: { font: 'sans', size: 12, lineHeight: 16, weight: 700, letterSpacing: 1.7, color: 'textTertiary' },
} as const satisfies Record<string, TextStyle>;

export type TextStyleName = keyof typeof textStyles;

/**
 * What the native bars take as values. A bar cannot read `var(--...)`, so the colours it needs are
 * named here and `app.config.ts` hands them over.
 */
export const nativeChrome = {
  header: {
    titleFontFamily: nativeFontName(fontFamily.sans, 600),
    titleFontSize: 17,
  },
  tabBar: {
    labelFontFamily: nativeFontName(fontFamily.sans, 600),
    labelFontSize: 11,
  },
} as const;

/**
 * Motion. Time, curves and distances, named for the role they play and never written into a
 * component. The values are the design's own motion card: feedback in about 100 ms, an entrance in
 * 280 ms with a 40 ms stagger and a 12 point rise, one default curve, and a spring of stiffness 400
 * and damping 30. Calm by design: the user should feel an interaction more than notice it.
 *
 * Nothing here is CSS. Ng Native drives a CSS `transition` from JavaScript, frame by frame, so the
 * motion that matters (press, entrance) uses `Animated` with the native driver instead; see the
 * motion section of docs/ARCHITECTURE.md. Native navigation keeps its own motion and has no token.
 */
export const motion = {
  /** Milliseconds. */
  duration: {
    /** Feedback that must feel like the finger itself: a press going in. */
    instant: 90,
    /** A small state change: a press coming back, a fade. */
    fast: 160,
    /** An element entering. */
    normal: 280,
  },
  easing: {
    /** The design's default curve, as a cubic bezier: quick out of the gate, settling softly. */
    standard: [0.22, 0.61, 0.36, 1],
  },
  spring: {
    /** Quick and nearly critically damped: it settles with a hint of life and no wobble. */
    snappy: { stiffness: 400, damping: 30, mass: 1 },
  },
  /**
   * An entrance: each logical group fades in while it rises `rise` points, and the next group starts
   * `stagger` ms later. `light` is the same motion with less of it, for a screen that is itself
   * arriving by a native transition.
   */
  enter: {
    full: { rise: 12, stagger: 40 },
    light: { rise: 8, stagger: 30 },
  },
  /**
   * Pressing. The surface under the finger dips a little and dims a little. A larger surface dips
   * less, because the same fraction is more points; a round button dips more. `recovery` is how it
   * comes back: a spring for a card or the add action, a plain ease for a control that should not
   * bounce.
   */
  press: {
    opacity: 0.92,
    role: {
      /** A card: secondary and compact collection cards, a document. */
      card: { scale: 0.97, recovery: 'spring' },
      /** A large card: the primary and featured collection cards. */
      surface: { scale: 0.985, recovery: 'spring' },
      /** A control: the search field, a button. */
      control: { scale: 0.975, recovery: 'ease' },
      /** The round add action: small, so a hair more than a card, to read as much. */
      round: { scale: 0.96, recovery: 'spring' },
    },
  },
} as const;

export type PressRole = keyof typeof motion.press.role;
export type EnterIntensity = keyof typeof motion.enter;

/**
 * How the add sheet opens: a native `formSheet`, sized to its own content and dimming what is
 * behind it, rather than a hand-built overlay. Not part of the CSS radius scale: these are props
 * on the native sheet (`NativeNavigation.present`), not a stylesheet.
 */
export const addSheetPresentation = { cornerRadius: 28, detent: 0.42 } as const;
