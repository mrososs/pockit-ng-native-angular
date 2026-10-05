import { Dialogs, type NativeDialogs } from '@ng-native/device';
import { DocumentPicker } from '@ng-native/expo/document-picker';
import { FileSystem } from '@ng-native/expo/file-system';
import { ImagePicker } from '@ng-native/expo/image-picker';
import { type FakeFabric, type FakeFabricNode, screen, userEvent, waitFor, within } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { POCKIT_DATABASE } from '../../core/storage/pockit-database.ts';
import { VaultFiles } from '../../core/storage/vault-files.ts';
import { fakeFileSystem } from '../../testing/file-system.ts';
import { renderApp } from '../../testing/render.ts';
import { fakeDatabase } from '../../testing/sqlite.ts';
import { named, textOf } from '../../testing/tree.ts';

/** The native screen under the "Review" header: AddSheet stays mounted beneath it, so a plain
 * `screen.getByRole` would also find its own, identically-labelled "Cancel". */
function reviewScreen(fabric: FakeFabric): FakeFabricNode {
  const match = named(fabric.committed, 'RNSScreen').find((node) =>
    named([node], 'Paragraph').some(
      (paragraph) => paragraph.props['accessibilityRole'] === 'header' && textOf(paragraph) === 'Review',
    ),
  );
  if (!match) {
    throw new Error('no screen with a "Review" header is on screen');
  }
  return match;
}

/** `choose()` on Android goes through `alert`; picking `index` presses that button. */
function fakeDialogs(index: number): NativeDialogs {
  return {
    platform: 'android',
    alert: (_title, _message, buttons) => void buttons[index]?.onPress?.(),
  };
}

function fakeImagePicker(uri: string) {
  const result = { canceled: false, assets: [{ uri, mimeType: 'image/jpeg' }] };
  const granted = { status: 'granted', granted: true, canAskAgain: true } as const;
  return {
    launchImageLibraryAsync: vi.fn().mockResolvedValue(result),
    launchCameraAsync: vi.fn().mockResolvedValue(result),
    getMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue(granted),
    requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue(granted),
    getCameraPermissionsAsync: vi.fn().mockResolvedValue(granted),
    requestCameraPermissionsAsync: vi.fn().mockResolvedValue(granted),
  };
}

/** Everything a test needs to get from Home to Review with a real (in-memory) vault behind it. */
function withWorkingVault(dialogChoice = 0) {
  return [
    { provide: FileSystem.SOURCE, useValue: fakeFileSystem().native },
    { provide: VaultFiles.SOURCE, useValue: { open: () => ({ bytes: async () => new Uint8Array([1]), delete: () => {} }) } },
    { provide: ImagePicker.SOURCE, useValue: fakeImagePicker('file:///picked.jpg') },
    { provide: DocumentPicker.SOURCE, useValue: { getDocumentAsync: vi.fn() } },
    { provide: Dialogs.SOURCE, useValue: fakeDialogs(dialogChoice) },
    { provide: POCKIT_DATABASE, useValue: fakeDatabase() },
  ];
}

async function openReview(dialogChoice = 0) {
  const result = await renderApp({ providers: withWorkingVault(dialogChoice) });
  await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
  await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());
  await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));
  await waitFor(() => expect(screen.getByRole('header', { name: 'Review' })).toBeTruthy());
  return result;
}

describe('Review', () => {
  test('defaults to the first collection, and Save is disabled with no name', async () => {
    await openReview();

    expect(screen.getByRole('button', { name: /^Collection: Personal Documents$/ })).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Save to Pockit' });
    expect((save.props['accessibilityState'] as { disabled?: boolean } | undefined)?.disabled).toBe(true);
  });

  test('choosing a collection updates the field', async () => {
    await openReview(1); // the second choice in PREDEFINED_COLLECTIONS: Certificates

    await userEvent.press(screen.getByRole('button', { name: /^Collection: Personal Documents$/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Collection: Certificates$/ })).toBeTruthy(),
    );
  });

  test('Save writes the document and closes back to Home', async () => {
    await openReview();
    await userEvent.type(screen.getByDisplayValue(''), 'National ID');

    await waitFor(() => {
      const save = screen.getByRole('button', { name: 'Save to Pockit' });
      expect((save.props['accessibilityState'] as { disabled?: boolean } | undefined)?.disabled).toBeFalsy();
    });
    await userEvent.press(screen.getByRole('button', { name: 'Save to Pockit' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Personal Documents, 1 document' })).toBeTruthy();
  });

  test('Cancel removes the copy and closes back to Home without saving', async () => {
    const deleted: string[] = [];
    const { fabric } = await renderApp({
      providers: [
        ...withWorkingVault(),
        {
          provide: VaultFiles.SOURCE,
          useValue: { open: (uri: string) => ({ bytes: async () => new Uint8Array([1]), delete: () => deleted.push(uri) }) },
        },
      ],
    });
    await userEvent.press(screen.getByRole('button', { name: 'Add document' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Add to Pockit' })).toBeTruthy());
    await userEvent.press(screen.getByRole('button', { name: 'Photos, Choose from your gallery' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Review' })).toBeTruthy());

    // AddSheet stays mounted beneath Review and has its own "Cancel", so this one is scoped to it.
    await userEvent.press(within(reviewScreen(fabric)).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy());
    expect(deleted).toHaveLength(1);
    expect(screen.getByRole('header', { name: 'Add your first document' })).toBeTruthy();
  });

  test('the close (X) button does the same as Cancel', async () => {
    await openReview();

    await userEvent.press(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.getByRole('header', { name: 'Your Vault' })).toBeTruthy());
  });
});
