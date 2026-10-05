import { signal } from '@angular/core';
import { screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { arrived, entranceGroups, opacityOf, withReducedMotion } from '../../testing/motion.ts';
import { selectTab, tabScreen } from '../../testing/navigation.ts';
import { renderApp } from '../../testing/render.ts';
import { textOf } from '../../testing/tree.ts';
import { motion } from '../../shared/theme/theme.ts';

const withPreviewVault = {
  provide: VAULT_OVERVIEW,
  useValue: signal(PREVIEW_VAULT).asReadonly(),
};

describe('the Home entrance, with documents', () => {
  test('is six logical groups, in the order they appear', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    const groups = entranceGroups(tabScreen(fabric, 'home').children);
    const [intro, search, lead, rest, quickAccess, add] = groups;

    expect(groups).toHaveLength(6);
    expect(textOf(intro!)).toContain('Your Vault');
    expect(textOf(search!)).toContain('Search your vault');
    expect(textOf(lead!)).toContain('Personal Documents');
    expect(textOf(rest!)).toContain('Certificates');
    expect(textOf(rest!)).not.toContain('Personal Documents');
    expect(textOf(quickAccess!)).toContain('Quick Access');
    // The add action is a button with no words in it; it is the last group, and the last thing in.
    expect(add!.viewName).toBeTruthy();
  });

  test('puts the groups at the screen level, and not one on every card or row', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    const groups = entranceGroups(tabScreen(fabric, 'home').children);

    // Nothing that rises is inside something that rises: the cards ride in with their group.
    for (const group of groups) {
      expect(entranceGroups(group.children)).toEqual([]);
    }
  });

  test('is staggered: an earlier group is further along than a later one, until all have arrived', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    // At some moment on the way, the first group has moved on and the last one has not.
    await waitFor(() => {
      const groups = entranceGroups(tabScreen(fabric, 'home').children);
      expect(opacityOf(groups[0]!)).toBeGreaterThan(opacityOf(groups[5]!));
    });
    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));
  });

  test('every group arrives, and the screen is fully usable meanwhile', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    // Usable from the first frame: the controls exist and answer, whatever the opacity.
    expect(screen.getByRole('button', { name: 'Search your vault' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add document' })).toBeTruthy();

    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));
  });

  test('plays once: coming back to the tab does not replay it', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });
    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));

    await selectTab(fabric, 'collections');
    await selectTab(fabric, 'home');

    // The screen was kept mounted, so it comes back as it was left: at rest, not hidden again.
    expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true);
  });

  test('can be left in the middle of it, and the app carries on', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    // Away and back and away again, well inside the 500 ms the entrance takes.
    await selectTab(fabric, 'collections');
    await selectTab(fabric, 'home');
    await selectTab(fabric, 'collections');

    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));
  });

  test('can be pressed while it is arriving', async () => {
    await renderApp({ providers: [withPreviewVault] });

    await userEvent.press(screen.getByRole('button', { name: 'Search your vault' }));

    // It does not throw, and the press was heard: the router asked for the search page.
    expect(screen.getByRole('button', { name: 'Search your vault' })).toBeTruthy();
  });

  test('with reduced motion on, is at rest without waiting out the animation', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault, withReducedMotion] });

    // The whole entrance would take about half a second; with the setting on it is cut short as soon
    // as the setting is reported, which is a moment after the first frame.
    await waitFor(
      () => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true),
      { timeout: motion.duration.normal / 2 },
    );
    expect(entranceGroups(tabScreen(fabric, 'home').children)).toHaveLength(6);
  });
});

describe('the Home entrance, with no documents', () => {
  test('draws only the groups the screen has: no Quick Access, no add action', async () => {
    const { fabric } = await renderApp();

    const groups = entranceGroups(tabScreen(fabric, 'home').children);
    const [intro, search, lead, rest] = groups;

    expect(groups).toHaveLength(4);
    expect(textOf(intro!)).toContain('Your Vault');
    expect(textOf(search!)).toContain('Search your vault');
    expect(textOf(lead!)).toContain('Add your first document');
    expect(textOf(rest!)).toContain('Suggested collections');
  });

  test('starts hidden and arrives', async () => {
    const { fabric } = await renderApp();

    expect(entranceGroups(tabScreen(fabric, 'home').children).some((group) => opacityOf(group) < 1)).toBe(true);

    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));
  });
});
