import { describe, expect, test } from 'vitest';
import { nativeChrome, palette } from './shared/theme/theme.ts';
import { renderApp } from './testing/render.ts';
import { named } from './testing/tree.ts';

/**
 * The native header, tab bar and status bar cannot read the cascade, so they are given values. These
 * tests hold those values to the design's roles, so a bar cannot drift from the screens it sits on.
 */
describe('the native bars', () => {
  test('the header takes the ground, the primary text, and the design font', async () => {
    const { fabric } = await renderApp();

    const [header] = named(fabric.committed, 'RNSScreenStackHeaderConfig');

    expect(header?.props).toMatchObject({
      backgroundColor: palette.background,
      color: palette.textPrimary,
      titleColor: palette.textPrimary,
      titleFontFamily: nativeChrome.header.titleFontFamily,
      titleFontSize: nativeChrome.header.titleFontSize,
      userInterfaceStyle: 'dark',
    });
  });

  test('the tab bar is the chrome surface, with a hairline on top', async () => {
    const { fabric } = await renderApp();

    const [tab] = named(fabric.committed, 'RNSTabsScreenIOS');

    expect(tab?.props['standardAppearance']).toMatchObject({
      tabBarBackgroundColor: palette.chrome,
      tabBarShadowColor: palette.divider,
    });
  });

  test('a tab is tertiary when idle and the accent when selected, labelled in the design font', async () => {
    const { fabric } = await renderApp();

    const [tab] = named(fabric.committed, 'RNSTabsScreenIOS');
    const label = {
      tabBarItemTitleFontFamily: nativeChrome.tabBar.labelFontFamily,
      tabBarItemTitleFontSize: nativeChrome.tabBar.labelFontSize,
    };

    expect(tab?.props['standardAppearance']).toMatchObject({
      stacked: {
        normal: {
          ...label,
          tabBarItemIconColor: palette.textTertiary,
          tabBarItemTitleFontColor: palette.textTertiary,
        },
        selected: {
          ...label,
          tabBarItemIconColor: palette.accent,
          tabBarItemTitleFontColor: palette.accent,
        },
      },
    });
  });

  test('the bar is dark and tinted with the accent', async () => {
    const { fabric } = await renderApp();

    const bar = fabric.find('RNSTabsHostIOS');

    expect(bar?.props).toMatchObject({ colorScheme: 'dark' });
  });
});
