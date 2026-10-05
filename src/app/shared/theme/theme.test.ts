import { readFileSync, readdirSync } from 'node:fs';
import { registrationsFor } from '@ng-native/expo/fonts';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { globalStyleSheet } from './global-styles.ts';
import { buildGlobalCss } from './theme-css.ts';
import {
  collectionPalette,
  fontFaces,
  fontFamily,
  nativeChrome,
  nativeFontName,
  palette,
  radius,
  size,
  space,
  textStyles,
  type ColorKey,
} from './theme.ts';

const appDir = new URL('../../', import.meta.url);
const globalCss = readFileSync(new URL('./global.css', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

/** `surfaceElevated` -> `surface-elevated`. */
function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** WCAG 2.x relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
}

describe('global.css', () => {
  test('is generated from theme.ts: run `npm run theme` after changing the theme', () => {
    expect(globalCss).toBe(buildGlobalCss());
  });

  test('declares a token for every colour, space, radius and size', () => {
    const expected = [
      ...Object.entries(palette).map(([key, value]) => `--color-${kebab(key)}: ${value};`),
      ...Object.entries(space).map(([key, value]) => `--space-${key}: ${value}px;`),
      ...Object.entries(radius).map(([key, value]) => `--radius-${key}: ${value}px;`),
      ...Object.entries(size).map(([key, value]) => `--size-${key}: ${value}px;`),
    ];

    for (const declaration of expected) {
      expect(globalCss).toContain(declaration);
    }
  });

  test('has an accent class for every collection, and a type class for every text style', () => {
    for (const collection of PREDEFINED_COLLECTIONS) {
      expect(globalCss).toContain(`.collection-${collection.id} {`);
      expect(collectionPalette).toHaveProperty([collection.id]);
    }
    for (const name of Object.keys(textStyles)) {
      expect(globalCss).toContain(`.text-${name} {`);
    }
  });
});

describe('contrast', () => {
  const aa = 4.5;
  /** The tertiary text role is the design's own and measures below AA; see docs/ARCHITECTURE.md. */
  const designTertiaryFloor = 3;
  const surfaces: ColorKey[] = ['background', 'surface', 'surfaceElevated', 'chrome'];

  test.each(
    (['textPrimary', 'textSecondary'] as const).flatMap((text) =>
      surfaces.map((surface) => [text, surface] as const),
    ),
  )('%s is readable on %s', (text, surface) => {
    expect(contrast(palette[text], palette[surface])).toBeGreaterThanOrEqual(aa);
  });

  test.each(['background', 'surface', 'chrome'] as const)(
    'tertiary text keeps the floor the design has on %s',
    (surface) => {
      expect(contrast(palette.textTertiary, palette[surface])).toBeGreaterThanOrEqual(
        designTertiaryFloor,
      );
    },
  );

  test.each(['background', 'surface', 'chrome'] as const)('the accent is readable on %s', (surface) => {
    expect(contrast(palette.accent, palette[surface])).toBeGreaterThanOrEqual(aa);
  });

  test('the ink on the accent is readable on it', () => {
    expect(contrast(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(aa);
  });

  test.each(['success', 'warning', 'danger', 'favorite'] as const)(
    '%s is readable on the app ground',
    (status) => {
      expect(contrast(palette[status], palette.background)).toBeGreaterThanOrEqual(aa);
    },
  );

  test.each(Object.entries(collectionPalette))('the %s accent is readable on its card', (_id, colors) => {
    const ground = 'surface' in colors ? colors.surface : palette.surface;
    expect(contrast(colors.accent, ground)).toBeGreaterThanOrEqual(aa);
  });
});

describe('fonts', () => {
  const faces = registrationsFor(
    (globalStyleSheet()?.fonts ?? []).map((face) => ({ ...face })),
  );

  test('the compiled stylesheet carries every bundled face', () => {
    expect(globalStyleSheet()?.fonts).toHaveLength(fontFaces.length);
  });

  test('every text style names a face that is bundled, in the weight and slant it asks for', () => {
    for (const [name, style] of Object.entries(textStyles)) {
      const family = fontFamily[style.font];
      const face = fontFaces.find((one) => one.family === family && one.weight === style.weight);
      expect(face, `${name}: no ${family} face at ${style.weight}`).toBeDefined();
      expect(face && 'italic' in face, `${name}: slant`).toBe('italic' in style);
      // The class names the family by its registered name, which the compiled sheet registers.
      expect(Object.keys(faces), name).toContain(nativeFontName(family, style.weight));
    }
  });

  test('the type classes name a registered family and never set a weight of their own', () => {
    // Native does no weight matching, so a `font-weight` would draw the regular face, or a faked bold.
    const blocks = globalCss.split('\n\n');
    const typeClasses = blocks.filter((block) => block.startsWith('.text-') && block.includes('font-family'));

    for (const block of typeClasses) {
      expect(block).not.toMatch(/font-weight|font-style/);
    }
    expect(typeClasses).toHaveLength(Object.keys(textStyles).length);
  });

  test('the native header and tab bar name a font that is registered', () => {
    expect(Object.keys(faces)).toContain(nativeChrome.header.titleFontFamily);
    expect(Object.keys(faces)).toContain(nativeChrome.tabBar.labelFontFamily);
  });
});

describe('token use', () => {
  /** A `var()` of an undefined custom property drops its declaration without a word on a device. */
  test('every design token a component reads is defined', () => {
    const defined = new Set([...globalCss.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]!));
    const missing: string[] = [];

    const files = readdirSync(appDir, { recursive: true, encoding: 'utf8' })
      .map((path) => path.replaceAll('\\', '/'))
      .filter((path) => /\.(css|ts)$/.test(path) && !path.endsWith('.test.ts'));

    for (const file of files) {
      const source = readFileSync(new URL(file, appDir), 'utf8');
      for (const match of source.matchAll(/var\(\s*(--(?:color|space|radius|size|shadow|collection)-[\w-]+)/g)) {
        if (!defined.has(match[1]!)) {
          missing.push(`${file}: ${match[1]}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
