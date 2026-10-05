import { screen, waitFor, within } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { routes } from './app.routes.ts';
import { palette } from './shared/theme/theme.ts';
import { selectTab, tabScreen } from './testing/navigation.ts';
import { renderApp } from './testing/render.ts';
import { named, rgb, textOf } from './testing/tree.ts';

const TAB_PATHS = ['home', 'collections', 'search', 'settings'];

test('opens on Home', async () => {
  await renderApp();

  expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy();
});

test('has a tab for every tab route, and a route for every tab', async () => {
  const { fabric } = await renderApp();

  const tabs = named(fabric.committed, 'RNSTabsScreenIOS').map((tab) => tab.props['screenKey']);
  const tabRoutes = routes[0]?.children?.map((route) => route.path).filter((path) => path);

  expect(tabs).toEqual(TAB_PATHS);
  expect(tabRoutes).toEqual(TAB_PATHS);
});

test('draws a symbol for each tab on iOS', async () => {
  const { fabric } = await renderApp();

  const icons = named(fabric.committed, 'RNSTabsScreenIOS').map((tab) => tab.props['iconType']);

  expect(icons).toEqual(TAB_PATHS.map(() => 'sfSymbol'));
});

test.each([
  ['collections', 'Collections'],
  ['settings', 'Settings'],
])('opens the %s tab on its own page', async (key, title) => {
  const { fabric } = await renderApp();

  await selectTab(fabric, key);

  await waitFor(() =>
    expect(within(tabScreen(fabric, key)).getByRole('header', { name: title })).toBeTruthy(),
  );
});

test('opens the search tab on its own page', async () => {
  // Search has no big page title (the design draws none, screens 07-09): the field itself is the
  // first thing on the page, so this checks for that instead of a `PageTitle` header.
  const { fabric } = await renderApp();

  await selectTab(fabric, 'search');

  await waitFor(() =>
    expect(
      within(tabScreen(fabric, 'search')).getByPlaceholderText('Search your vault'),
    ).toBeTruthy(),
  );
});

test('gives every screen the design system: the ground, the text colour and the fonts', async () => {
  const { fabric } = await renderApp();

  const screens = named(fabric.committed, 'RNSScreen');
  expect(screens.length).toBeGreaterThan(0);
  for (const nativeScreen of screens) {
    expect(nativeScreen.props['backgroundColor']).toBe(rgb(palette.background));
  }

  // Set once, in the global stylesheet, and met by text inside a page the router created.
  const title = named(fabric.committed, 'Paragraph').find((text) => textOf(text) === 'Your Vault');
  expect(title?.props).toMatchObject({
    color: rgb(palette.textPrimary),
    fontFamily: 'Playfair Display-500',
    fontSize: 34,
  });
});
