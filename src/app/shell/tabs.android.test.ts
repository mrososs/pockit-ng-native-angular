import { registerPlatformComponents } from '@ng-native/fabric';
import { expect, test } from 'vitest';
import { nativeChrome, palette } from '../shared/theme/theme.ts';
import { renderApp } from '../testing/render.ts';
import { named } from '../testing/tree.ts';

// `registerPlatformComponents` is process-wide state, so Android is exercised in a file of its own:
// Vitest gives every file fresh modules, and the iOS tests in `app.test.ts` stay iOS.
registerPlatformComponents('android');

test('draws the design\'s glyph for each tab on Android, as a tinted image', async () => {
  const { fabric } = await renderApp();

  const tabs = named(fabric.committed, 'RNSTabsScreenAndroid');

  expect(tabs.map((tab) => tab.props['screenKey'])).toEqual([
    'home',
    'collections',
    'search',
    'settings',
  ]);
  for (const tab of tabs) {
    expect(tab.props['imageIconResource']).toBeDefined();
    expect(tab.props['iconType']).toBeUndefined();
  }
});

test('takes each Android icon from the design\'s own glyph files', async () => {
  const { fabric } = await renderApp();

  const sources = named(fabric.committed, 'RNSTabsScreenAndroid').map((tab) =>
    JSON.stringify(tab.props['imageIconResource']),
  );

  expect(sources).toEqual([
    expect.stringContaining('tab-home.png'),
    expect.stringContaining('tab-layers.png'),
    expect.stringContaining('tab-search.png'),
    expect.stringContaining('tab-sliders.png'),
  ]);
});

test('styles the Android bar from the theme, in the flat shape Android reads', async () => {
  const { fabric } = await renderApp();

  const [tab] = named(fabric.committed, 'RNSTabsScreenAndroid');

  expect(tab?.props['standardAppearance']).toEqual({
    tabBarBackgroundColor: palette.chrome,
    // The design has no pill behind the selected icon, and a label under every tab.
    tabBarItemActiveIndicatorEnabled: false,
    tabBarItemLabelVisibilityMode: 'labeled',
    tabBarItemTitleFontFamily: nativeChrome.tabBar.labelFontFamily,
    tabBarItemTitleSmallLabelFontSize: nativeChrome.tabBar.labelFontSize,
    tabBarItemTitleLargeLabelFontSize: nativeChrome.tabBar.labelFontSize,
    normal: {
      tabBarItemIconColor: palette.textTertiary,
      tabBarItemTitleFontColor: palette.textTertiary,
    },
    selected: {
      tabBarItemIconColor: palette.accent,
      tabBarItemTitleFontColor: palette.accent,
    },
  });
});

test('does not nest the Android colours under the iOS shape, which Android ignores', async () => {
  const { fabric } = await renderApp();

  const [tab] = named(fabric.committed, 'RNSTabsScreenAndroid');

  const appearance = tab?.props['standardAppearance'] as Record<string, unknown>;

  expect(appearance['normal']).toBeDefined();
  expect(appearance['stacked']).toBeUndefined();
});
