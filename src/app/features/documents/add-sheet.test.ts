import { signal } from '@angular/core';
import { ImagePicker, type PickedAsset } from '@ng-native/expo/image-picker';
import { screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { VAULT_OVERVIEW } from '../../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
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

const withPreviewVault = { provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() };

describe('AddSheet content', () => {
  test('offers Camera and Photos, each with its own explanation, and a way to back out', async () => {
    await renderApp({ providers: [{ provide: ImagePicker.SOURCE, useValue: fakePicker([]) }] });

    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    expect(screen.getByRole('button', { name: 'Camera, Take a photo' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Photos, Choose from your gallery' }),
    ).toBeTruthy();
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

  test('a picked photo closes the sheet, the same as Cancel', async () => {
    await renderApp({
      providers: [
        { provide: ImagePicker.SOURCE, useValue: fakePicker([{ uri: 'file:///picked.jpg' }]) },
      ],
    });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));

    await waitFor(() =>
      expect(screen.queryByRole('header', { name: 'Add to Pockit' })).toBeNull(),
    );
  });
});
