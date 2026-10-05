import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { type FakeFabric, type FakeFabricNode, waitFor, within } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { renderApp } from '../../testing/render.ts';
import { headerTitles, named } from '../../testing/tree.ts';

/**
 * Favorites is pushed on top of Home, which stays mounted beneath it and shares some of its
 * documents' labels (Quick Access), so a plain `screen` query can find both. `named` lists parents
 * before children, so an ancestor that merely contains a "Quick Access" header somewhere inside it
 * (the tab's own stack screen) matches too; the last match is the innermost one - Favorites' own
 * screen, and nothing nested inside it.
 */
function favoritesScreen(fabric: FakeFabric): FakeFabricNode {
  const matches = named(fabric.committed, 'RNSScreen').filter((screen) =>
    named([screen], 'RNSScreenStackHeaderConfig').some((header) => header.props['title'] === 'Quick Access'),
  );
  const match = matches.at(-1);
  if (!match) {
    throw new Error('no screen with a "Quick Access" header is on screen');
  }
  return match;
}

describe('Favorites', () => {
  test('is its own empty state until something can be favourited (Phase 9)', async () => {
    const { fabric, componentRef } = await renderApp();

    await componentRef.injector.get(Router).navigateByUrl('/home/favorites');

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Quick Access'));
    expect(within(favoritesScreen(fabric)).getByRole('header', { name: 'No favourites yet' })).toBeTruthy();
  });

  test('lists every favourite document as a grid, with the count in its subtitle', async () => {
    const { fabric, componentRef } = await renderApp({
      providers: [{ provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() }],
    });

    await componentRef.injector.get(Router).navigateByUrl('/home/favorites');

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Quick Access'));
    const page = within(favoritesScreen(fabric));
    expect(page.getByText('3 favorite documents')).toBeTruthy();
    for (const favorite of PREVIEW_VAULT.favorites) {
      expect(page.getByRole('button', { name: `${favorite.title}, ${favorite.kind}` })).toBeTruthy();
    }
  });
});
