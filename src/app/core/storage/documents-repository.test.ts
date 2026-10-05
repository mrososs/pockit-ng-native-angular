import { describe, expect, test } from 'vitest';
import { fakeDatabase } from '../../testing/sqlite.ts';
import { renderApp } from '../../testing/render.ts';
import { POCKIT_DATABASE } from './pockit-database.ts';
import { DocumentsRepository } from './documents-repository.ts';

describe('DocumentsRepository', () => {
  test('inserts a document and lists it back, newest first', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const repository = componentRef.injector.get(DocumentsRepository);

    const first = await repository.insert({
      title: 'National ID',
      collectionId: 'personal-documents',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });
    const second = await repository.insert({
      title: 'Degree',
      collectionId: 'certificates',
      fileType: 'pdf',
      fileUri: 'file://vault/b.pdf',
    });

    const documents = await repository.list();

    expect(documents.map((document) => document.id)).toEqual([second.id, first.id]);
    expect(documents[1]).toMatchObject({
      title: 'National ID',
      collectionId: 'personal-documents',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
      isFavorite: false,
    });
  });

  test('starts empty', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });

    expect(await componentRef.injector.get(DocumentsRepository).list()).toEqual([]);
  });

  test('sets a document favourite, and back again', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const repository = componentRef.injector.get(DocumentsRepository);
    const document = await repository.insert({
      title: 'Passport',
      collectionId: 'personal-documents',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    await repository.setFavorite(document.id, true);
    expect((await repository.list())[0]).toMatchObject({ id: document.id, isFavorite: true });

    await repository.setFavorite(document.id, false);
    expect((await repository.list())[0]).toMatchObject({ id: document.id, isFavorite: false });
  });

  test('renames a document and moves it to another collection', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const repository = componentRef.injector.get(DocumentsRepository);
    const document = await repository.insert({
      title: 'Passport',
      collectionId: 'personal-documents',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    await repository.update(document.id, { title: 'Old Passport', collectionId: 'important' });

    expect((await repository.list())[0]).toMatchObject({
      id: document.id,
      title: 'Old Passport',
      collectionId: 'important',
    });
  });

  test('removes a document', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }],
    });
    const repository = componentRef.injector.get(DocumentsRepository);
    const document = await repository.insert({
      title: 'Passport',
      collectionId: 'personal-documents',
      fileType: 'image',
      fileUri: 'file://vault/a.jpg',
    });

    await repository.remove(document.id);

    expect(await repository.list()).toEqual([]);
  });
});
