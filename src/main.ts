import { AppRegistry, Image, Platform, processColor } from 'react-native';
import { mount } from '@ng-native/platform';
import { currentConditions, deviceTokens, watchConditions } from '@ng-native/device';
import { loadFonts } from '@ng-native/expo/fonts';
import { getFabricUIManager, registerPlatformComponents } from '@ng-native/fabric';
import { App } from './app/app.ts';
import { appConfig } from './app/app.config.ts';
import { globalStyleSheet } from './app/shared/theme/global-styles.ts';

registerPlatformComponents(Platform.OS);

AppRegistry.registerRunnable('main', ({ rootTag }: { rootTag: number | string }) => {
  const globalStyles = globalStyleSheet();

  // The design's fonts are registered before the first frame, so no text is laid out in a fallback
  // face and then again in the real one. A font that fails to load is logged, and the app starts
  // in the system face rather than not at all.
  void loadFonts(globalStyles)
    .catch((error: unknown) => console.error(error))
    .then(() => {
      const app = mount(Number(rootTag), App, getFabricUIManager(), {
        // The design system: tokens, type scale and fonts, matched against every node.
        globalStyles: globalStyles ?? undefined,
        // Colours, as the integers the platform wants.
        processColor,
        // What `@media` resolves against. Without it every media query is false and a responsive
        // layout renders as its smallest case.
        conditions: currentConditions(),
        // Values only the device knows - the hairline width, which is a third of a point on a 3x
        // screen. Without it `1px` is what you get, and that is a visibly fat divider.
        tokens: deviceTokens(),
        // Turns a `require('./x.png')` into something native can load. Without it images are blank.
        resolveAssetSource: (value) => Image.resolveAssetSource(value as never),
        // App-wide providers: the native router, and what else the app adds in `app.config.ts`.
        providers: appConfig.providers,
      });

      // Re-resolves the conditions when the device rotates or the theme changes. A rotation dirties
      // no component and no binding, so without this nothing re-renders and `dark:` stops following
      // the system switch.
      watchConditions(app.engine);
    });
});
