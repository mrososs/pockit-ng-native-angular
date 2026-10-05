import { signal } from '@angular/core';
import { DocumentPicker, type PickedDocument } from '@ng-native/expo/document-picker';
import { FileSystem } from '@ng-native/expo/file-system';
import { ImagePicker, type PickedAsset } from '@ng-native/expo/image-picker';
import { screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { VaultFiles } from '../../core/storage/vault-files.ts';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { fakeFileSystem } from '../../testing/file-system.ts';
import { renderApp } from '../../testing/render.ts';

const GRANTED = { status: 'granted', granted: true, canAskAgain: true } as const;

/** A fake `expo-image-picker`: answers with `assets`, or "cancelled" for an empty list. */
function fakePicker(assets: readonly Partial<PickedAsset>[]) {
  const result = { canceled: assets.length === 0, assets };
  return {
    launchImageLibraryAsync: vi.fn().mockResolvedValue(result),
    launchCameraAsync: vi.fn().mockResolvedValue(result),
    getMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue(GRANTED),
    requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue(GRANTED),
    getCameraPermissionsAsync: vi.fn().mockResolvedValue(GRANTED),
    requestCameraPermissionsAsync: vi.fn().mockResolvedValue(GRANTED),
  };
}

/** A fake `expo-document-picker`: answers with `assets`, or "cancelled" for an empty list. */
function fakeDocumentPicker(assets: readonly Partial<PickedDocument>[]) {
  const getDocumentAsync = vi
    .fn()
    .mockResolvedValue(assets.length === 0 ? { canceled: true, assets: null } : { canceled: false, assets });
  return { getDocumentAsync };
}

/** A fake `expo-file-system`'s `File`, reading whatever bytes a test wants a uri to hold. */
function fakeReader() {
  return { open: () => ({ bytes: async () => new Uint8Array([1]), delete: () => {} }) };
}

/** Lets a successful pick's copy into the vault succeed, so the sheet dismisses. */
const withWorkingVault = [
  { provide: FileSystem.SOURCE, useValue: fakeFileSystem().native },
  { provide: VaultFiles.SOURCE, useValue: fakeReader() },
];

const withPreviewVault = { provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() };

describe('AddSheet content', () => {
  test('offers Camera, Photos and Files, each with its own explanation, and a way to back out', async () => {
    await renderApp({
      providers: [
        { provide: ImagePicker.SOURCE, useValue: fakePicker([]) },
        { provide: DocumentPicker.SOURCE, useValue: fakeDocumentPicker([]) },
      ],
    });

    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    expect(screen.getByRole('button', { name: 'Camera, Take a photo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Photos, Choose from your gallery' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Files, Choose PDF or document' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  test('Camera opens the system camera, not the library', async () => {
    const native = fakePicker([]);
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: native }] });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Camera, Take a photo' }));

    expect(native.launchCameraAsync).toHaveBeenCalledTimes(1);
    expect(native.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  test('Photos opens the library, not the camera', async () => {
    const native = fakePicker([]);
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: native }] });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));

    expect(native.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(native.launchCameraAsync).not.toHaveBeenCalled();
  });

  test('Files opens the system document picker, for any file', async () => {
    const native = fakeDocumentPicker([]);
    await renderApp({ providers: [{ provide: DocumentPicker.SOURCE, useValue: native }] });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Files, Choose PDF or document' }));

    expect(native.getDocumentAsync).toHaveBeenCalledTimes(1);
  });
});

describe('the add sheet, opened from the app', () => {
  test('opens from the empty vault\'s invitation, and Cancel closes it without picking anything', async () => {
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: fakePicker([]) }] });

    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.queryByRole('header', { name: 'Add to Pockit' })).toBeNull(),
    );
  });

  test('opens from the floating add button once the vault has documents', async () => {
    await renderApp({
      providers: [withPreviewVault, { provide: ImagePicker.SOURCE, useValue: fakePicker([]) }],
    });

    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());
  });

  test('opens from a collection\'s empty state', async () => {
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: fakePicker([]) }] });

    await userEvent.press(screen.getByRole('button', { name: 'Certificates, Empty' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Document' })).toBeTruthy());
    await userEvent.press(screen.getByRole('button', { name: 'Add Document' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());
  });

  test('a cancelled picker leaves the sheet open to try again', async () => {
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: fakePicker([]) }] });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Camera, Take a photo' }));

    expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy();
  });

  test('a picked photo is copied into the vault, then opens Review on top of the sheet', async () => {
    await renderApp({
      providers: [
        ...withWorkingVault,
        { provide: ImagePicker.SOURCE, useValue: fakePicker([{ uri: 'file:///picked.jpg' }]) },
      ],
    });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Review' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Save to Pockit' })).toBeTruthy();
  });

  test('a picked document is copied into the vault, then opens Review with its name suggested', async () => {
    await renderApp({
      providers: [
        ...withWorkingVault,
        {
          provide: DocumentPicker.SOURCE,
          useValue: fakeDocumentPicker([{ uri: 'file:///picked.pdf', name: 'Birth Certificate.pdf' }]),
        },
      ],
    });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Files, Choose PDF or document' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Review' })).toBeTruthy());
    expect(screen.getByDisplayValue('Birth Certificate')).toBeTruthy();
  });

  test('a copy that fails leaves the sheet open, even though the pick itself succeeded', async () => {
    await renderApp({
      providers: [
        { provide: VaultFiles.SOURCE, useValue: null },
        { provide: ImagePicker.SOURCE, useValue: fakePicker([{ uri: 'file:///picked.jpg' }]) },
      ],
    });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));

    expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy();
  });
});
