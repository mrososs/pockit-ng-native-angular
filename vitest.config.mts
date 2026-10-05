import { fileURLToPath } from 'node:url';
import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig, type Plugin } from 'vitest/config';

/**
 * The design system's stylesheet declares its fonts with `@font-face`, and the compiler turns each
 * `url()` into a `require()` of the file. `ngNative()` stubs asset requires in the source it is
 * given, but these appear only in what it compiles, so under Node the module would throw. This
 * stubs them the same way (`{ testUri }`), after the compile, so a test can render with the very
 * stylesheet the app mounts, fonts and all.
 */
function stubCompiledFontRequires(): Plugin {
  return {
    name: 'pockit-stub-compiled-font-requires',
    enforce: 'post',
    transform(code, id) {
      if (!/\.m?ts$/.test(id.split('?')[0]!)) {
        return null;
      }
      const stubbed = code.replace(
        /\brequire\(\s*(['"])([^'"]+\.(?:ttf|otf))\1\s*\)/g,
        (_match, _quote, path: string) => `({ testUri: ${JSON.stringify(path)} })`,
      );
      return stubbed === code ? null : { code: stubbed, map: null };
    },
  };
}

// `@ng-native/components/animations` is React Native's `Animated` on a device, which is Flow source
// Node cannot load. Its `browser` export is the same directive and the same `Animated` API with no
// React in it, stepped by `requestAnimationFrame`: the documented web build. Tests use that, so a
// component's motion runs for real against the fake native layer, with the same code as the app's.
const webAnimations = fileURLToPath(
  new URL('./node_modules/@ng-native/components/dist/animations-web.js', import.meta.url),
);

// Compiles Angular for the tests the way Metro compiles it for the app. Tests run in Node against
// a fake of the native side: no simulator, no device.
export default defineConfig({
  plugins: [ngNative(), stubCompiledFontRequires()],
  resolve: { alias: { '@ng-native/components/animations': webAnimations } },
});
