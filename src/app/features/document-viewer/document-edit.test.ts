import { Dialogs, type NativeDialogs } from '@ng-native/device';
import { type FakeFabric, type FakeFabricNode, screen, userEvent, waitFor, within } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { VaultStore } from '../../core/services/vault-store.ts';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { renderApp } from '../../testing/render.ts';
import { named, textOf } from '../../testing/tree.ts';

/** The viewer stays mounted beneath Edit, and both have their own "Close" - scope to Edit's own. */
function editScreen(fabric: FakeFabric): FakeFabricNode {
  const match = named(fabric.committed, 'RNSScreen').find((node) =>
    named([node], 'Paragraph').some(
      (paragraph) => paragraph.props['accessibilityRole'] === 'header' && textOf(paragraph) === 'Edit Document',
    ),
  );
  if (!match) {
    throw new Error('no screen with an "Edit Document" header is on screen');
  }
  return match;
}

const image: DocumentPreview = {
  id: 'doc-passport',
  title: 'Passport',
  kind: 'Photo',
  thumbnail: { tone: 'rose' },
  favorite: false,
  collectionId: 'personal-documents',
  fileUri: 'file:///vault/passport.jpg',
  fileType: 'image',
};

/** `choose()` goes through `alert`; picking `index` presses that choice. */
function fakeDialogs(index: number): NativeDialogs {
  return {
    platform: 'android',
    alert: (_title, _message, buttons) => void buttons[index]?.onPress?.(),
  };
}

async function openEdit(dialogChoice = 0) {
  const result = await renderApp({ providers: [{ provide: Dialogs.SOURCE, useValue: fakeDialogs(dialogChoice) }] });
  result.componentRef.injector.get(DocumentViewerStore).open(image);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy());
  await userEvent.press(screen.getByRole('button', { name: 'Edit' }));
  await waitFor(() => expect(screen.getByRole('header', { name: 'Edit Document' })).toBeTruthy());
  return result;
}

describe('DocumentEdit', () => {
  test('starts with the document\'s own name and collection', async () => {
    await openEdit();

    expect(screen.getByDisplayValue('Passport')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Collection: Personal Documents$/ })).toBeTruthy();
  });

  test('Save is disabled with no name', async () => {
    await openEdit();

    await userEvent.clear(screen.getByDisplayValue('Passport'));

    await waitFor(() => {
      const save = screen.getByRole('button', { name: 'Save changes' });
      expect((save.props['accessibilityState'] as { disabled?: boolean } | undefined)?.disabled).toBe(true);
    });
  });

  test('choosing a collection updates the field', async () => {
    await openEdit(1); // the second choice in PREDEFINED_COLLECTIONS: Certificates

    await userEvent.press(screen.getByRole('button', { name: /^Collection: Personal Documents$/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Collection: Certificates$/ })).toBeTruthy(),
    );
  });

  test('Save renames and moves the document, then returns to the viewer', async () => {
    const { componentRef } = await openEdit(1);
    const update = vi.spyOn(componentRef.injector.get(VaultStore), 'update').mockResolvedValue();

    await userEvent.type(screen.getByDisplayValue('Passport'), ' (old)');
    await userEvent.press(screen.getByRole('button', { name: /^Collection: Personal Documents$/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Collection: Certificates$/ })).toBeTruthy());

    await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('header', { name: 'Edit Document' })).toBeNull());
    expect(update).toHaveBeenCalledWith(image.id, { title: 'Passport (old)', collectionId: 'certificates' });
    expect(screen.getByText('Passport (old)')).toBeTruthy();
  });

  test('Cancel discards changes and returns to the viewer unchanged', async () => {
    await openEdit();

    await userEvent.type(screen.getByDisplayValue('Passport'), ' (old)');
    await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('header', { name: 'Edit Document' })).toBeNull());
    expect(screen.getByText('Passport')).toBeTruthy();
  });

  test('the close (X) button does the same as Cancel', async () => {
    const { fabric } = await openEdit();

    // The viewer stays mounted beneath Edit and has its own "Close" too, so this is scoped to Edit's.
    await userEvent.press(within(editScreen(fabric)).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('header', { name: 'Edit Document' })).toBeNull());
  });
});
