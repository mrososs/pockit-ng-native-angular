import { FileSystem } from '@ng-native/expo/file-system';
import { describe, expect, test } from 'vitest';
import { fakeFileSystem } from '../../testing/file-system.ts';
import { renderApp } from '../../testing/render.ts';
import { VaultFiles, type NativeFileReader, vaultFileName } from './vault-files.ts';

function fakeReader(bytesByUri: Record<string, Uint8Array>): NativeFileReader {
  return {
    open: (uri) => ({ bytes: async () => bytesByUri[uri] ?? new Uint8Array(), delete: () => {} }),
  };
}

const SOURCE_URI = 'file://picked/source';
const CONTENT = new TextEncoder().encode('hello vault');

describe('VaultFiles', () => {
  test('copies the source bytes into its own vault/ folder, under a fresh name', async () => {
    const fs = fakeFileSystem();
    const { componentRef } = await renderApp({
      providers: [
        { provide: FileSystem.SOURCE, useValue: fs.native },
        { provide: VaultFiles.SOURCE, useValue: fakeReader({ [SOURCE_URI]: CONTENT }) },
      ],
    });

    const uri = await componentRef.injector.get(VaultFiles).copy(SOURCE_URI, { mimeType: 'image/jpeg' });

    expect(uri).toMatch(/^file:\/\/vault\/.+\.jpg$/);
    const [path] = [...fs.store.keys()];
    expect(fs.store.get(path!)).toEqual(CONTENT);
  });

  test('two copies never collide, even with the same hint', async () => {
    const fs = fakeFileSystem();
    const { componentRef } = await renderApp({
      providers: [
        { provide: FileSystem.SOURCE, useValue: fs.native },
        { provide: VaultFiles.SOURCE, useValue: fakeReader({ [SOURCE_URI]: CONTENT }) },
      ],
    });
    const vaultFiles = componentRef.injector.get(VaultFiles);

    const first = await vaultFiles.copy(SOURCE_URI, { mimeType: 'image/jpeg' });
    const second = await vaultFiles.copy(SOURCE_URI, { mimeType: 'image/jpeg' });

    expect(first).not.toBe(second);
    expect(fs.store.size).toBe(2);
  });

  test('refuses without expo-file-system installed', async () => {
    const { componentRef } = await renderApp({
      providers: [{ provide: VaultFiles.SOURCE, useValue: null }],
    });

    await expect(componentRef.injector.get(VaultFiles).copy(SOURCE_URI)).rejects.toThrow(
      'expo-file-system is not installed',
    );
  });

  test('remove() deletes a copy, for a draft backed out of before saving', async () => {
    const deleted: string[] = [];
    const { componentRef } = await renderApp({
      providers: [
        {
          provide: VaultFiles.SOURCE,
          useValue: { open: (uri: string) => ({ bytes: async () => new Uint8Array(), delete: () => deleted.push(uri) }) },
        },
      ],
    });

    componentRef.injector.get(VaultFiles).remove('file://vault/abc.jpg');

    expect(deleted).toEqual(['file://vault/abc.jpg']);
  });
});

describe('vaultFileName', () => {
  test('keeps the original extension, from the name before the mime type', () => {
    expect(vaultFileName({ originalName: 'National ID.PNG', mimeType: 'image/jpeg' })).toMatch(/\.png$/);
    expect(vaultFileName({ mimeType: 'application/pdf' })).toMatch(/\.pdf$/);
    expect(vaultFileName({ mimeType: 'image/jpeg' })).toMatch(/\.jpg$/);
  });

  test('falls back to .bin with no hint at all', () => {
    expect(vaultFileName({})).toMatch(/\.bin$/);
  });
});
