import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const appDir = new URL('./', import.meta.url);

/** Every source file of the app that ships: not a test, not the test helpers. */
function shippedSources(): { readonly file: string; readonly text: string }[] {
  return readdirSync(appDir, { recursive: true, encoding: 'utf8' })
    .map((path) => path.replaceAll('\\', '/'))
    .filter(
      (path) =>
        /\.(ts|css)$/.test(path) && !path.endsWith('.test.ts') && !path.startsWith('testing/'),
    )
    .map((file) => ({ file, text: readFileSync(new URL(file, appDir), 'utf8') }));
}

/** The code, with comments taken out, so prose that mentions a word does not count as using it. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('the app stays native', () => {
  test('uses no browser-only API', () => {
    const browserOnly =
      /\b(?:document|window|localStorage|sessionStorage|navigator)\.|@angular\/platform-browser|@angular\/animations|\bIonic\b|\bcapacitor\b/i;

    const offenders = shippedSources()
      .filter(({ text }) => browserOnly.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('uses no web element in a template', () => {
    const webElements = /<\s*(?:div|span|button|input|img|a|ul|li|p|h[1-6])[\s>/]/;

    const offenders = shippedSources()
      .filter(({ file, text }) => file.endsWith('.ts') && webElements.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});

describe('the design system is used, not copied', () => {
  /** The thumbnails' redacted artwork is the one place colours belong to a component. */
  const mayHoldColours = new Set([
    'shared/theme/theme.ts',
    'shared/theme/theme-css.ts',
    'shared/theme/global.css',
    'shared/components/document-thumb/document-thumb.ts',
  ]);

  test('no component writes a colour literally', () => {
    const colour = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

    const offenders = shippedSources()
      .filter(({ file }) => !mayHoldColours.has(file))
      .filter(({ text }) => colour.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('no component sets a font family itself', () => {
    const offenders = shippedSources()
      .filter(({ file }) => !file.startsWith('shared/theme/'))
      .filter(({ text }) => /font-family\s*:/.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});

describe('demo data stays out of the app', () => {
  test('only the dev-preview switch in app.config.ts reaches the preview fixtures', () => {
    const reachesPreview = /preview\/preview-vault/;

    const offenders = shippedSources()
      .filter(({ file }) => !file.startsWith('preview/') && file !== 'app.config.ts')
      .filter(({ text }) => reachesPreview.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('app.config.ts loads the fixtures only in a development build with the preview switch on', () => {
    const config = withoutComments(readFileSync(new URL('app.config.ts', appDir), 'utf8'));

    expect(config).not.toMatch(/^import[^;]*preview-vault/m);
    // The `require` is inside a positive `if`, which Metro folds away in a release build. After an
    // early `return` it would stay in the bundle (checked against a real export: it did).
    expect(config).toMatch(
      /if \(__DEV__ && process\.env\.EXPO_PUBLIC_POCKIT_PREVIEW === '1'\) \{[\s\S]*?require\('\.\/preview\/preview-vault\.ts'\)/,
    );
  });
});

describe('motion stays in its layer', () => {
  /** The motion layer, and the one file that holds its numbers. */
  const motionLayer = (file: string) => file.startsWith('shared/motion/');
  const tokens = 'shared/theme/theme.ts';

  const templates = () => shippedSources().filter(({ file }) => file.endsWith('.ts'));

  test('only the motion layer drives an animation: no component builds its own', () => {
    const driving = /\bAnimated\.(?:timing|spring|sequence|parallel|delay|loop|Value)\b|\bEasing\.|\buseNativeDriver\b|\bLayoutAnimation\b/;

    const offenders = shippedSources()
      .filter(({ file }) => !motionLayer(file))
      .filter(({ text }) => driving.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('keeps every motion number in the tokens, and none copied into a component', () => {
    const timeOrCurve =
      /\b(?:duration|delay|stiffness|damping|mass)\s*:\s*\d|cubic-bezier\(|\bEasing\.bezier\(\s*[\d.]|\bscale\s*:\s*0?\.\d|\b(?:translateY|translateX)\s*:\s*-?\d/;
    // A CSS transition or animation with a time written in it: `transition: opacity 120ms`.
    const cssTiming = /\b(?:transition|animation)(?:-duration|-delay)?\s*:[^;{}]*\b\d*\.?\d+m?s\b/;

    const offenders = shippedSources()
      .filter(({ file }) => file !== tokens)
      .filter(({ text }) => {
        const code = withoutComments(text);
        return timeOrCurve.test(code) || cssTiming.test(code);
      })
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('has no timer choreography: nothing is sequenced with setTimeout or setInterval', () => {
    const offenders = shippedSources()
      .filter(({ text }) => /\b(?:setTimeout|setInterval|setImmediate)\s*\(/.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('uses no animation API that belongs to a browser', () => {
    const browserAnimation =
      /@angular\/animations|\.animate\(|\.getAnimations\(|\brequestAnimationFrame\b|\bcancelAnimationFrame\b|\bIntersectionObserver\b|\bmatchMedia\b|\banimationend\b|\btransitionend\b|\bView ?Transition/;

    const offenders = shippedSources()
      .filter(({ text }) => browserAnimation.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('puts no per-frame work in Angular for scrolling: no scroll handler writes a signal', () => {
    const scrollBinding = /\((?:scroll|scrollBeginDrag|scrollEndDrag|momentumScrollBegin|momentumScrollEnd)\)\s*=/;
    const scrollSignal = /\bcontentOffset\b|\bscrollY\b|\bscrollOffset\b/;

    const offenders = templates()
      .filter(({ text }) => scrollBinding.test(text) || scrollSignal.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('wraps no pressable in a style that moves: the touch target holds still', () => {
    const animatedPressable = /<pressable[^>]*\banimatedStyle\b/;

    const offenders = templates()
      .filter(({ text }) => animatedPressable.test(text))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });

  test('gives every pressable a press response, a role and a label', () => {
    const pressables = templates().filter(({ file, text }) => !motionLayer(file) && /<pressable\b/.test(withoutComments(text)));

    expect(pressables.length).toBeGreaterThan(0);
    for (const { file, text } of pressables) {
      expect(text, `${file} wires pressIn`).toMatch(/\(pressIn\)\s*=\s*"press\.in\(\)"/);
      expect(text, `${file} wires pressOut`).toMatch(/\(pressOut\)\s*=\s*"press\.out\(\)"/);
      expect(text, `${file} creates its press response`).toMatch(/pressMotion\(/);
      expect(text, `${file} names its role`).toMatch(/accessibilityRole\s*=\s*"button"/);
      expect(text, `${file} labels itself`).toMatch(/\[accessibilityLabel\]/);
    }
  });

  test('reads the reduced-motion setting wherever the motion layer animates', () => {
    const animating = shippedSources().filter(
      ({ file, text }) => motionLayer(file) && /\bAnimated\./.test(withoutComments(text)),
    );

    expect(animating.length).toBeGreaterThan(0);
    for (const { file, text } of animating) {
      expect(withoutComments(text), `${file} reads Accessibility`).toMatch(/\.reduceMotion\(\)/);
    }
  });

  test('has Home and Collections arrive through the same entrance, not each its own', () => {
    for (const file of ['features/home/home.ts', 'features/collections/collections.ts']) {
      const code = withoutComments(readFileSync(new URL(file, appDir), 'utf8'));

      expect(code, `${file} uses the shared entrance`).toMatch(/import \{ enterMotion \} from '\.\.\/\.\.\/shared\/motion\/enter-motion\.ts'/);
      expect(code, `${file} builds no animation itself`).not.toMatch(/\bAnimated\./);
    }
    // Home arrives in full; Collections is the same motion with less of it.
    expect(readFileSync(new URL('features/home/home.ts', appDir), 'utf8')).toMatch(/enterMotion\(.*, 'full'\)/);
    expect(readFileSync(new URL('features/collections/collections.ts', appDir), 'utf8')).toMatch(
      /enterMotion\(.*, 'light'\)/,
    );
  });

  test('leaves the native navigation to the platform: the shell and the routes animate nothing', () => {
    const navigation = shippedSources().filter(
      ({ file }) => file.startsWith('shell/') || file === 'app.routes.ts' || file === 'app.ts',
    );

    expect(navigation.length).toBeGreaterThan(0);
    for (const { file, text } of navigation) {
      expect(withoutComments(text), `${file} animates nothing`).not.toMatch(
        /animatedStyle|@ng-native\/components\/animations|shared\/motion\/|@ng-native\/components\/reanimated/,
      );
    }
  });

  test('installs a worklet or gesture library only if something uses it', () => {
    const manifest = JSON.parse(readFileSync(new URL('../../package.json', appDir), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const installed = (name: string) => name in (manifest.dependencies ?? {});
    const sources = shippedSources().map(({ text }) => withoutComments(text)).join('\n');

    if (installed('react-native-reanimated') || installed('react-native-worklets')) {
      expect(sources).toMatch(/@ng-native\/components\/reanimated/);
    }
    if (installed('react-native-gesture-handler')) {
      expect(sources).toMatch(/\bgesture[A-Z]|@ng-native\/components\/gestures/);
    }
  });

  test('keeps the preview fixtures out of the motion layer too', () => {
    const offenders = shippedSources()
      .filter(({ file }) => motionLayer(file))
      .filter(({ text }) => /preview\//.test(withoutComments(text)))
      .map(({ file }) => file);

    expect(offenders).toEqual([]);
  });
});
