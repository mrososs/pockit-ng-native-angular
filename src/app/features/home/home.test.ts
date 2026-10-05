import { signal } from '@angular/core';
import { screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { EMPTY_VAULT, VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { requestedTab } from '../../testing/navigation.ts';
import { renderApp } from '../../testing/render.ts';
import { headerTitles, visualOf } from '../../testing/tree.ts';

const withPreviewVault = {
  provide: VAULT_OVERVIEW,
  useValue: signal(PREVIEW_VAULT).asReadonly(),
};

function collectionButtons(): (string | undefined)[] {
  const names = PREDEFINED_COLLECTIONS.map((collection) => collection.name);
  return screen
    .getAllByRole('button')
    .map((button) => button.props['accessibilityLabel'] as string | undefined)
    .filter((label) => names.some((name) => label?.startsWith(`${name},`)));
}

describe('Home with an empty vault, which is the real state', () => {
  test('invites the first document, and offers the collections as a list', async () => {
    await renderApp();

    expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy();
    expect(screen.getByText('Keep important documents easy to find.')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Add your first document' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Suggested collections' })).toBeTruthy();
  });

  test('lists every configured collection, in the configured order', async () => {
    await renderApp();

    expect(collectionButtons()).toEqual(
      PREDEFINED_COLLECTIONS.map((collection) => `${collection.name}, Empty`),
    );
  });

  test('shows no Quick Access and no floating add button', async () => {
    await renderApp();

    expect(screen.queryByText('Quick Access')).toBeNull();
    // The only "Add document" is the invitation's own button, inside the hero.
    expect(screen.getAllByRole('button', { name: 'Add document' })).toHaveLength(1);
    expect(visualOf(screen.getByRole('button', { name: 'Add document' })).props['width']).not.toBe(56);
  });

  test('starts empty unless something provides a vault', () => {
    expect(Object.values(EMPTY_VAULT.counts).every((count) => count === 0)).toBe(true);
    expect(EMPTY_VAULT.favorites).toEqual([]);
  });
});

describe('Home with documents', () => {
  test('shows the collections as cards with their counts, led by the large one', async () => {
    await renderApp({ providers: [withPreviewVault] });

    expect(screen.getByRole('button', { name: 'Personal Documents, 6 documents' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Certificates, 4 documents' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Important, 3 documents' })).toBeTruthy();
    expect(screen.getByText('Everything important, right where you need it.')).toBeTruthy();
    expect(screen.queryByRole('header', { name: 'Add your first document' })).toBeNull();
  });

  test('shows the favourites as Quick Access', async () => {
    await renderApp({ providers: [withPreviewVault] });

    expect(screen.getByRole('header', { name: 'Quick Access' })).toBeTruthy();
    for (const favourite of PREVIEW_VAULT.favorites) {
      expect(
        screen.getByRole('button', { name: `${favourite.title}, ${favourite.kind}` }),
      ).toBeTruthy();
    }
  });

  test('floats the add button above the content', async () => {
    await renderApp({ providers: [withPreviewVault] });

    const add = screen.getByRole('button', { name: 'Add document' });
    expect(visualOf(add).props['width']).toBe(56);
    expect(visualOf(add).props['height']).toBe(56);
  });

  test('Quick Access "See all" opens the favourites page', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    await userEvent.press(screen.getByRole('button', { name: 'See all' }));

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Quick Access'));
  });
});

describe('Home navigation', () => {
  test('opens a collection on the Collections tab, with its native header', async () => {
    const { fabric } = await renderApp();

    await userEvent.press(screen.getByRole('button', { name: 'Certificates, Empty' }));

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));
    expect(requestedTab(fabric)).toBe('collections');
  });

  test('opens a collection from a populated card too', async () => {
    const { fabric } = await renderApp({ providers: [withPreviewVault] });

    await userEvent.press(screen.getByRole('button', { name: 'Personal Documents, 6 documents' }));

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Personal Documents'));
  });

  test('sends the search field to the Search tab', async () => {
    const { fabric } = await renderApp();
    expect(requestedTab(fabric)).not.toBe('search');

    await userEvent.press(screen.getByRole('button', { name: 'Search your vault' }));

    await waitFor(() => expect(requestedTab(fabric)).toBe('search'));
  });
});
