import { type ApplicationConfig, type Provider, signal } from '@angular/core';
import { withComponentInputBinding } from '@angular/router';
import {
  type TabAppearance,
  type TabItemAppearance,
  provideNativeRouter,
  withHeaderDefaults,
  withTabDefaults,
} from '@ng-native/router';
import { routes } from './app.routes.ts';
import { VAULT_OVERVIEW } from './core/services/vault-overview.ts';
import { nativeChrome, palette } from './shared/theme/theme.ts';

/**
 * The native header and tab bar are configured with values, not styles, so they take their colours
 * and fonts from the theme rather than from the design tokens. A screen can still override either.
 */
const tabLabel = {
  tabBarItemTitleFontFamily: nativeChrome.tabBar.labelFontFamily,
  tabBarItemTitleFontSize: nativeChrome.tabBar.labelFontSize,
};

const tabItems: TabItemAppearance = {
  normal: {
    ...tabLabel,
    tabBarItemIconColor: palette.textTertiary,
    tabBarItemTitleFontColor: palette.textTertiary,
  },
  selected: {
    ...tabLabel,
    tabBarItemIconColor: palette.accent,
    tabBarItemTitleFontColor: palette.accent,
  },
};

const tabBar: TabAppearance = {
  tabBarBackgroundColor: palette.chrome,
  tabBarShadowColor: palette.divider,
  stacked: tabItems,
  inline: tabItems,
  compactInline: tabItems,
};

/**
 * A vault with something in it, for looking at the filled-in screens. Only a development build
 * started with `EXPO_PUBLIC_POCKIT_PREVIEW=1` has it. Metro inlines both conditions, so a release
 * build folds this to nothing and never bundles the fixtures.
 */
function previewProviders(): Provider[] {
  // The `require` sits inside the branch, as a positive condition: that is the shape Metro folds
  // away in a release build. An early `return` before it leaves the module in the bundle.
  if (__DEV__ && process.env.EXPO_PUBLIC_POCKIT_PREVIEW === '1') {
    const { PREVIEW_VAULT } = require('./preview/preview-vault.ts') as typeof import('./preview/preview-vault.ts');
    return [{ provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() }];
  }
  return [];
}

/**
 * App-wide providers, handed to `mount()` in `src/main.ts`. `withComponentInputBinding()` makes a
 * route parameter, and a route's resolved data, arrive as the page's input of the same name.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideNativeRouter(
      routes,
      withComponentInputBinding(),
      withHeaderDefaults({
        userInterfaceStyle: 'dark',
        backgroundColor: palette.background,
        // The back button and any header action.
        color: palette.textPrimary,
        titleColor: palette.textPrimary,
        titleFontFamily: nativeChrome.header.titleFontFamily,
        titleFontSize: nativeChrome.header.titleFontSize,
        hideShadow: true,
        backButtonDisplayMode: 'minimal',
      }),
      withTabDefaults({
        colorScheme: 'dark',
        tintColor: palette.accent,
        backgroundColor: palette.background,
        standardAppearance: tabBar,
        scrollEdgeAppearance: tabBar,
      }),
    ),
    ...previewProviders(),
  ],
};
