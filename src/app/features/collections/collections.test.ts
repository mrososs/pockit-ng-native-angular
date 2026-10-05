import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { userEvent, waitFor, within } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { selectTab, tabScreen } from '../../testing/navigation.ts';
import { renderApp } from '../../testing/render.ts';
import { headerTitles, named, rgb, textOf } from '../../testing/tree.ts';
import { collectionPalette } from '../../shared/theme/theme.ts';

async function openCollectionsTab() {
  const rendered = await renderApp();
  await selectTab(rendered.fabric, 'collections');
  await waitFor(() =>
    expect(within(tabScreen(rendered.fabric, 'collections')).getByRole('header', { name: 'Collections' })).toBeTruthy(),
  );
  return { ...rendered, tab: () => within(tabScreen(rendered.fabric, 'collections')) };
}

describe('Collections', () => {
  test('is built from the same collection list as Home, in the same order', async () => {
    const { tab } = await openCollectionsTab();

    const labels = tab()
      .getAllByRole('button')
      .map((button) => button.props['accessibilityLabel']);

    expect(labels).toEqual(PREDEFINED_COLLECTIONS.map((collection) => `${collection.name}, Empty`));
  });

  test('says how many collections there are', async () => {
    const { tab } = await openCollectionsTab();

    expect(tab().getByText(`${PREDEFINED_COLLECTIONS.length} collections`)).toBeTruthy();
  });

  test('shows each collection\'s count once the vault has documents', async () => {
    const rendered = await renderApp({
      providers: [{ provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() }],
    });
    await selectTab(rendered.fabric, 'collections');
    await waitFor(() =>
      expect(within(tabScreen(rendered.fabric, 'collections')).getByRole('button', { name: 'Certificates, 4 documents' })).toBeTruthy(),
    );
  });

  test('opens a collection when its card is pressed', async () => {
    const { fabric, tab } = await openCollectionsTab();

    await userEvent.press(tab().getByRole('button', { name: 'Important, Empty' }));

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Important'));
  });
});

describe('Collection detail', () => {
  test('resolves a real collection: its name in the native header, and the empty state', async () => {
    const { fabric, componentRef } = await renderApp();
    const router = componentRef.injector.get(Router);

    await router.navigateByUrl('/collections/certificates');

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));
    const detail = within(tabScreen(fabric, 'collections'));
    expect(detail.getByRole('header', { name: 'No documents yet' })).toBeTruthy();
    expect(detail.getByText("Add important documents here so they're always easy to find.")).toBeTruthy();
    expect(detail.getByRole('button', { name: 'Add Document' })).toBeTruthy();
  });

  test('draws the empty state in the collection\'s own accent', async () => {
    const { fabric, componentRef } = await renderApp();

    await componentRef.injector.get(Router).navigateByUrl('/collections/important');

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Important'));
    const tile = named(tabScreen(fabric, 'collections').children, 'Image').find(
      (image) => image.props['width'] === 32,
    );
    expect(tile?.props['tintColor']).toBe(rgb(collectionPalette.important.accent));
  });

  test('sends a collection that does not exist to the list instead of failing', async () => {
    const { fabric, componentRef } = await renderApp();
    const router = componentRef.injector.get(Router);

    await expect(router.navigateByUrl('/collections/not-a-collection')).resolves.toBeDefined();

    expect(router.url).not.toContain('not-a-collection');
    await waitFor(() =>
      expect(within(tabScreen(fabric, 'collections')).getByRole('header', { name: 'Collections' })).toBeTruthy(),
    );
    expect(headerTitles(fabric.committed)).not.toContain('not-a-collection');
    expect(textOf(tabScreen(fabric, 'collections'))).not.toContain('No documents yet');
  });

  test('shows its own documents as a grid, with a floating add button, once it has any', async () => {
    const { fabric, componentRef } = await renderApp({
      providers: [{ provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() }],
    });

    await componentRef.injector.get(Router).navigateByUrl('/collections/personal-documents');

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Personal Documents'));
    const detail = within(tabScreen(fabric, 'collections'));
    expect(detail.queryByRole('header', { name: 'No documents yet' })).toBeNull();
    // The preview fixture's own count (6) is cosmetic, for the card on Home and here; it only ever
    // made up 3 actual documents, so the page's own label - this collection's real document list -
    // says 3, not 6.
    expect(detail.getByText('3 documents')).toBeTruthy();
    for (const favorite of PREVIEW_VAULT.favorites) {
      expect(detail.getByRole('button', { name: `${favorite.title}, ${favorite.kind}` })).toBeTruthy();
    }
    expect(detail.getByRole('button', { name: 'Add document' })).toBeTruthy();
  });

  test('has no collection with an id that a path could mistake for another route', () => {
    for (const collection of PREDEFINED_COLLECTIONS) {
      expect(collection.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});
