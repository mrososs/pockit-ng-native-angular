import { type FakeFabric, gestureOf, screen, userEvent, waitFor } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { DocumentViewerStore } from '../../core/services/document-viewer-store.ts';
import { Sharing } from '../../core/services/sharing.ts';
import { VaultStore } from '../../core/services/vault-store.ts';
import type { DocumentPreview } from '../../core/types/document-preview.ts';
import { renderApp } from '../../testing/render.ts';
import { named } from '../../testing/tree.ts';

const image: DocumentPreview = {
  id: 'doc-national-id',
  title: 'National ID',
  kind: 'Photo',
  thumbnail: { tone: 'indigo' },
  favorite: false,
  collectionId: 'personal-documents',
  fileUri: 'file:///vault/national-id.jpg',
  fileType: 'image',
};

const pdf: DocumentPreview = {
  ...image,
  id: 'doc-birth-certificate',
  title: 'Birth Certificate',
  fileType: 'pdf',
  fileUri: 'file:///vault/birth-certificate.pdf',
};

/**
 * The document's own full-size image: distinct from an icon's, which is an `<image>` too. The
 * engine normalises `source` to an array of candidates, even for the one this component gives it.
 */
function documentImage(fabric: FakeFabric) {
  return named(fabric.committed, 'Image').find((node) => {
    const sources = node.props['source'] as readonly { uri?: string }[] | undefined;
    return sources?.some((source) => source.uri === image.fileUri);
  });
}

/** The `{ scale }` entry of a transform array `[workletStyle]` wrote directly onto the node. */
function scaleOf(fabric: FakeFabric): number | undefined {
  const transform = documentImage(fabric)?.props['transform'] as readonly { scale?: number }[] | undefined;
  return transform?.find((entry) => 'scale' in entry)?.scale;
}

function fakeSharing() {
  const shared: string[] = [];
  return {
    shared,
    provider: {
      provide: Sharing.SOURCE,
      useValue: {
        isAvailableAsync: async () => true,
        shareAsync: async (uri: string) => {
          shared.push(uri);
        },
      },
    },
  };
}

describe('DocumentViewerStore', () => {
  test('opens the viewer for an image', async () => {
    const { componentRef } = await renderApp();

    componentRef.injector.get(DocumentViewerStore).open(image);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy());
    expect(screen.getByText('National ID')).toBeTruthy();
  });

  test('shares anything that is not an image, instead of opening the viewer', async () => {
    const { shared, provider } = fakeSharing();
    const { componentRef } = await renderApp({ providers: [provider] });

    componentRef.injector.get(DocumentViewerStore).open(pdf);

    await waitFor(() => expect(shared).toEqual([pdf.fileUri]));
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

describe('DocumentViewer', () => {
  async function openViewer(preview: DocumentPreview = image) {
    const { shared, provider } = fakeSharing();
    const result = await renderApp({ providers: [provider] });
    result.componentRef.injector.get(DocumentViewerStore).open(preview);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy());
    return { ...result, shared };
  }

  test('shows the document\'s title and kind', async () => {
    await openViewer();

    expect(screen.getByText('National ID')).toBeTruthy();
    expect(screen.getByText('Photo')).toBeTruthy();
  });

  test('Close dismisses the viewer', async () => {
    await openViewer();

    await userEvent.press(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Close' })).toBeNull());
  });

  test('Favourite flips immediately and persists it', async () => {
    const { componentRef } = await openViewer();
    const setFavorite = vi.spyOn(componentRef.injector.get(VaultStore), 'setFavorite').mockResolvedValue();

    await userEvent.press(screen.getByRole('button', { name: 'Add to favourites' }));

    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeTruthy();
    expect(setFavorite).toHaveBeenCalledWith(image.id, true);
  });

  test('Share hands the file to the system share sheet', async () => {
    const { shared } = await openViewer();

    await userEvent.press(screen.getByRole('button', { name: 'Share' }));

    await waitFor(() => expect(shared).toEqual([image.fileUri]));
  });

  test('pinching zooms within the design\'s bounds', async () => {
    const { fabric } = await openViewer();
    const stage = screen.getByTestId('viewer-stage');
    const pinch = gestureOf(stage, 'Pinch');

    pinch.callbacks['onUpdate']!({ scale: 10 } as never);
    await waitFor(() => expect(scaleOf(fabric)).toBe(4));
  });

  test('a small drag does not dismiss; a long one does', async () => {
    await openViewer();
    const stage = screen.getByTestId('viewer-stage');
    const pan = gestureOf(stage, 'Pan');

    pan.callbacks['onUpdate']!({ translationY: 40, translationX: 0 } as never);
    pan.callbacks['onEnd']!({ translationY: 40, translationX: 0 } as never);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeTruthy();

    pan.callbacks['onUpdate']!({ translationY: 200, translationX: 0 } as never);
    pan.callbacks['onEnd']!({ translationY: 200, translationX: 0 } as never);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Close' })).toBeNull());
  });

  test('double tap zooms in, and back out again', async () => {
    const { fabric } = await openViewer();
    const stage = screen.getByTestId('viewer-stage');
    const doubleTap = gestureOf(stage, 'Tap');

    doubleTap.callbacks['onEnd']!({} as never);
    await waitFor(() => expect(scaleOf(fabric)).toBe(2));

    doubleTap.callbacks['onEnd']!({} as never);
    await waitFor(() => expect(scaleOf(fabric)).toBe(1));
  });
});
