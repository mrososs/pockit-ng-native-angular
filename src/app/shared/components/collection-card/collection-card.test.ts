import { screen, userEvent } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../../core/config/predefined-collections.ts';
import { renderThemed } from '../../../testing/render.ts';
import { named, rgb, visualOf } from '../../../testing/tree.ts';
import { collectionPalette } from '../../theme/theme.ts';
import { CollectionCard, type CollectionCardVariant } from './collection-card.ts';

const [personal, certificates] = PREDEFINED_COLLECTIONS as [
  (typeof PREDEFINED_COLLECTIONS)[number],
  (typeof PREDEFINED_COLLECTIONS)[number],
];

describe('CollectionCard accessibility', () => {
  test('is one button, labelled with the collection and how much is in it', async () => {
    await renderThemed(CollectionCard, { inputs: { collection: personal, count: 6 } });

    expect(screen.getByRole('button', { name: 'Personal Documents, 6 documents' })).toBeTruthy();
  });

  test('says "Empty" for a collection with nothing in it, and "1 document" for one', async () => {
    const { rerender } = await renderThemed(CollectionCard, { inputs: { collection: personal } });
    expect(screen.getByRole('button', { name: 'Personal Documents, Empty' })).toBeTruthy();

    await rerender({ inputs: { count: 1 } });

    expect(screen.getByRole('button', { name: 'Personal Documents, 1 document' })).toBeTruthy();
  });

  test('keeps its icon out of the accessibility tree, since the button carries the label', async () => {
    const { fabric } = await renderThemed(CollectionCard, { inputs: { collection: personal } });

    for (const icon of named(fabric.committed, 'Image')) {
      expect(icon.props['accessibilityLabel']).toBeUndefined();
    }
  });
});

describe('CollectionCard forms', () => {
  const heights: Record<CollectionCardVariant, number> = {
    primary: 156,
    featured: 96,
    secondary: 112,
    compact: 64,
  };

  // A minimum, not a fixed height: the card grows when its title wraps on a narrow screen or the
  // system font is larger, instead of clipping its text.
  test.each(Object.entries(heights) as [CollectionCardVariant, number][])(
    'the %s form is at least %i points tall, as the design draws it',
    async (variant, height) => {
      await renderThemed(CollectionCard, { inputs: { collection: personal, variant } });

      expect(visualOf(screen.getByRole('button')).props['minHeight']).toBe(height);
      expect(visualOf(screen.getByRole('button')).props['height']).toBeUndefined();
    },
  );

  test('a primary card with thumbnails keeps its text clear of them', async () => {
    const { fabric } = await renderThemed(CollectionCard, {
      inputs: { collection: personal, variant: 'primary', peek: [{ tone: 'teal' }] },
    });

    const copy = named(fabric.committed, 'View').filter((node) => node.props['maxWidth'] === '70%');

    expect(copy).toHaveLength(1);
  });

  test('a primary card without thumbnails lets its text run the full width', async () => {
    const { fabric } = await renderThemed(CollectionCard, {
      inputs: { collection: personal, variant: 'primary' },
    });

    expect(named(fabric.committed, 'View').filter((node) => node.props['maxWidth'] === '70%')).toHaveLength(0);
  });

  test('the large forms sit on the collection\'s own surface, the others on the neutral one', async () => {
    await renderThemed(CollectionCard, { inputs: { collection: personal, variant: 'primary' } });
    expect(visualOf(screen.getByRole('button')).props['backgroundColor']).toBe(
      rgb(collectionPalette['personal-documents'].surface),
    );
  });

  test('a collection without its own surface falls back to the neutral one', async () => {
    await renderThemed(CollectionCard, { inputs: { collection: certificates, variant: 'primary' } });

    expect(visualOf(screen.getByRole('button')).props['backgroundColor']).toBe('rgb(30, 36, 39)');
  });

  test('tints its icon with the collection\'s accent, through the cascade', async () => {
    const { fabric } = await renderThemed(CollectionCard, { inputs: { collection: certificates, variant: 'secondary' } });

    const [icon] = named(fabric.committed, 'Image');

    expect(icon?.props['tintColor']).toBe(rgb(collectionPalette.certificates.accent));
  });

  test('peeks at most two thumbnails out of a primary card', async () => {
    const { fabric } = await renderThemed(CollectionCard, {
      inputs: {
        collection: personal,
        variant: 'primary',
        count: 3,
        peek: [{ tone: 'teal' }, { tone: 'indigo' }, { tone: 'rose' }],
      },
    });

    // One tile icon, one chevron and the heart-less thumbnails: the third thumbnail is not drawn.
    const thumbnails = named(fabric.committed, 'View').filter(
      (node) => node.props['aspectRatio'] === 1.5,
    );
    expect(thumbnails).toHaveLength(2);
  });

  test('draws no thumbnails on the other forms', async () => {
    const { fabric } = await renderThemed(CollectionCard, {
      inputs: { collection: personal, variant: 'secondary', peek: [{ tone: 'teal' }] },
    });

    expect(named(fabric.committed, 'View').filter((node) => node.props['aspectRatio'] === 1.5)).toHaveLength(0);
  });
});

describe('CollectionCard press', () => {
  test('hands the collection to whoever opened it', async () => {
    const open = vi.fn();
    await renderThemed(CollectionCard, { inputs: { collection: certificates }, on: { open } });

    await userEvent.press(screen.getByRole('button'));

    expect(open).toHaveBeenCalledExactlyOnceWith(certificates);
  });
});
