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
});
