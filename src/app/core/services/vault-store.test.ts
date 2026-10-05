import { describe, expect, test } from 'vitest';
import { fakeDatabase } from '../../testing/sqlite.ts';
import { renderApp } from '../../testing/render.ts';
import { POCKIT_DATABASE } from '../storage/pockit-database.ts';
import { VAULT_OVERVIEW } from './vault-overview.ts';
import { VaultStore } from './vault-store.ts';

describe('VaultStore', () => {
  test('starts at the empty vault, and reflects a save once it resolves', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const overview = componentRef.injector.get(VAULT_OVERVIEW);
    const store = componentRef.injector.get(VaultStore);

    await store.save({
      title: 'Passport',
      collectionId: 'important',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    expect(overview().counts.important).toBe(1);
    expect(overview().counts['personal-documents']).toBe(0);
    expect(overview().peeks.important).toEqual([{ tone: 'indigo' }]);
  });

  test('a document is not a favourite until something makes it one', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const store = componentRef.injector.get(VaultStore);

    await store.save({
      title: 'Passport',
      collectionId: 'important',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    expect(componentRef.injector.get(VAULT_OVERVIEW)().favorites).toEqual([]);
  });

  test('setFavorite updates the document and is reflected in the overview', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const store = componentRef.injector.get(VaultStore);

    const saved = await store.save({
      title: 'Passport',
      collectionId: 'important',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });
    expect(componentRef.injector.get(VAULT_OVERVIEW)().favorites).toEqual([]);

    await store.setFavorite(saved.id, true);

    expect(componentRef.injector.get(VAULT_OVERVIEW)().favorites.map((favorite) => favorite.id)).toEqual([
      saved.id,
    ]);
  });

  test('update renames a document and moves it, reflected in the overview', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const store = componentRef.injector.get(VaultStore);
    const saved = await store.save({
      title: 'Passport',
      collectionId: 'important',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    await store.update(saved.id, { title: 'Old Passport', collectionId: 'certificates' });

    const overview = componentRef.injector.get(VAULT_OVERVIEW)();
    expect(overview.counts.important).toBe(0);
    expect(overview.counts.certificates).toBe(1);
    expect(overview.documentsByCollection.certificates?.[0]).toMatchObject({
      id: saved.id,
      title: 'Old Passport',
    });
  });

  test('remove deletes a document, reflected in the overview', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const store = componentRef.injector.get(VaultStore);
    const saved = await store.save({
      title: 'Passport',
      collectionId: 'important',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    await store.remove(saved.id);

    expect(componentRef.injector.get(VAULT_OVERVIEW)().counts.important).toBe(0);
  });

  test('a database that fails to open leaves the vault empty rather than throwing', async () => {
    const { componentRef } = await renderApp({
      providers: [], // No POCKIT_DATABASE override: the default factory finds no expo-sqlite.
    });

    expect(componentRef.injector.get(VAULT_OVERVIEW)().counts).toEqual({
      'personal-documents': 0,
      certificates: 0,
      important: 0,
    });
  });
});
