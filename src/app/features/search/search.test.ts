import { type Provider, signal } from '@angular/core';
import { screen, userEvent, waitFor, within } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { Sharing } from '../../core/services/sharing.ts';
import { EMPTY_VAULT, VAULT_OVERVIEW, type VaultOverview } from '../../core/services/vault-overview.ts';
import { selectTab, tabScreen } from '../../testing/navigation.ts';
import { renderApp } from '../../testing/render.ts';
import { headerTitles } from '../../testing/tree.ts';

const nationalId = {
  id: 'doc-national-id',
  title: 'National ID',
  kind: 'ID',
  thumbnail: { tone: 'indigo' },
  favorite: false,
  collectionId: 'personal-documents',
  fileUri: 'file:///national-id.jpg',
  fileType: 'image',
} as const;
const drivingLicense = {
  id: 'doc-driving-license',
  title: 'Driving License',
  kind: 'License',
  thumbnail: { tone: 'teal' },
  favorite: false,
  collectionId: 'personal-documents',
  fileUri: 'file:///driving-license.jpg',
  fileType: 'image',
} as const;
const workContract = {
  id: 'doc-work-contract',
  title: 'Work Contract',
  kind: 'PDF',
  thumbnail: { tone: 'paper' },
  favorite: false,
  collectionId: 'certificates',
  fileUri: 'file:///work-contract.pdf',
  fileType: 'pdf',
} as const;

const SEARCHABLE_VAULT: VaultOverview = {
  ...EMPTY_VAULT,
  documents: [nationalId, drivingLicense, workContract],
};

const withSearchableVault = { provide: VAULT_OVERVIEW, useValue: signal(SEARCHABLE_VAULT).asReadonly() };

async function openSearchTab(providers: readonly Provider[] = []) {
  const rendered = await renderApp({ providers });
  await selectTab(rendered.fabric, 'search');
  await waitFor(() =>
    expect(within(tabScreen(rendered.fabric, 'search')).getByPlaceholderText('Search your vault')).toBeTruthy(),
  );
  return { ...rendered, tab: () => within(tabScreen(rendered.fabric, 'search')) };
}

describe('Search, with no query', () => {
  test('offers the built-in collections to browse', async () => {
    const { tab } = await openSearchTab();

    expect(tab().getByRole('header', { name: 'Browse by collection' })).toBeTruthy();
    for (const collection of PREDEFINED_COLLECTIONS) {
      expect(tab().getByRole('button', { name: `${collection.name}, Empty` })).toBeTruthy();
    }
  });

  test('opens a collection from the browse list', async () => {
    const { fabric, tab } = await openSearchTab();

    await userEvent.press(tab().getByRole('button', { name: 'Certificates, Empty' }));

    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));
  });
});

describe('Search, with a query', () => {
  test('filters every document by title, case-insensitively', async () => {
    const { tab } = await openSearchTab([withSearchableVault]);

    await userEvent.type(tab().getByDisplayValue(''), 'license');

    await waitFor(() => expect(tab().getByText('1 result')).toBeTruthy());
    expect(tab().getByRole('button', { name: 'Driving License' })).toBeTruthy();
    expect(tab().queryByRole('button', { name: 'National ID' })).toBeNull();
  });

  test('shows no results, with the query itself and a way to add a document', async () => {
    const { tab } = await openSearchTab([withSearchableVault]);

    await userEvent.type(tab().getByDisplayValue(''), 'passport');

    await waitFor(() => expect(tab().getByRole('header', { name: 'No results' })).toBeTruthy());
    expect(tab().getByText(/passport/)).toBeTruthy();

    await userEvent.press(tab().getByRole('button', { name: 'Add document' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());
  });

  test('Clear empties the field back to the browse list', async () => {
    const { tab } = await openSearchTab([withSearchableVault]);

    await userEvent.type(tab().getByDisplayValue(''), 'license');
    await waitFor(() => expect(tab().getByText('1 result')).toBeTruthy());

    await userEvent.press(tab().getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(tab().getByRole('header', { name: 'Browse by collection' })).toBeTruthy());
  });

  test('Cancel does the same as Clear', async () => {
    const { tab } = await openSearchTab([withSearchableVault]);

    await userEvent.type(tab().getByDisplayValue(''), 'license');
    await waitFor(() => expect(tab().getByText('1 result')).toBeTruthy());

    await userEvent.press(tab().getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(tab().getByRole('header', { name: 'Browse by collection' })).toBeTruthy());
  });

  test('opens an image result in the document viewer', async () => {
    const { tab } = await openSearchTab([withSearchableVault]);

    await userEvent.type(tab().getByDisplayValue(''), 'national');
    await waitFor(() => expect(tab().getByRole('button', { name: 'National ID' })).toBeTruthy());

    await userEvent.press(tab().getByRole('button', { name: 'National ID' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy());
  });

  test('a PDF result goes straight to the share sheet instead', async () => {
    const shared: string[] = [];
    const { tab } = await openSearchTab([
      withSearchableVault,
      {
        provide: Sharing.SOURCE,
        useValue: { isAvailableAsync: async () => true, shareAsync: async (uri: string) => void shared.push(uri) },
      },
    ]);

    await userEvent.type(tab().getByDisplayValue(''), 'contract');
    await waitFor(() => expect(tab().getByRole('button', { name: 'Work Contract' })).toBeTruthy());

    await userEvent.press(tab().getByRole('button', { name: 'Work Contract' }));

    await waitFor(() => expect(shared).toEqual([workContract.fileUri]));
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

describe('Search screen', () => {
  test('has no big page title: the field is the first thing on it', async () => {
    const { tab } = await openSearchTab();

    expect(tab().queryByRole('header', { name: 'Search' })).toBeNull();
  });
});
