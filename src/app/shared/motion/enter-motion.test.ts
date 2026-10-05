import { screen, waitFor } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { arrived, entranceGroups, opacityOf, riseOf, withReducedMotion } from '../../testing/motion.ts';
import { renderThemed } from '../../testing/render.ts';
import { textOf } from '../../testing/tree.ts';
import { EmptyState } from '../components/empty-state/empty-state.ts';
import { motion } from '../theme/theme.ts';

const [personal] = PREDEFINED_COLLECTIONS as [(typeof PREDEFINED_COLLECTIONS)[number]];

const inputs = {
  icon: personal.icon,
  title: 'No documents yet',
  message: 'Add important documents here.',
  actionLabel: 'Add Document',
};

describe('the empty state\'s entrance', () => {
  test('is one composition: a single group holding the tile, the words and the button', async () => {
    const { fabric } = await renderThemed(EmptyState, { inputs });

    const groups = entranceGroups(fabric.committed);

    expect(groups).toHaveLength(1);
    expect(textOf(groups[0]!)).toContain('No documents yet');
    expect(textOf(groups[0]!)).toContain('Add important documents here.');
    expect(textOf(groups[0]!)).toContain('Add Document');
    expect(groups[0]!.children.length).toBeGreaterThan(0);
  });

  test('starts out of sight, a short way down, and arrives in place', async () => {
    const { fabric } = await renderThemed(EmptyState, { inputs });
    const [group] = entranceGroups(fabric.committed);

    expect(opacityOf(group!)).toBeLessThan(1);
    expect(riseOf(group!)).toBeGreaterThan(0);
    expect(riseOf(group!)).toBeLessThanOrEqual(motion.enter.light.rise);

    // Looked up afresh each time: a commit replaces the nodes it changed.
    await waitFor(() => expect(arrived(entranceGroups(fabric.committed))).toBe(true));
  });

  test('keeps the title a header and the button a button while it arrives', async () => {
    await renderThemed(EmptyState, { inputs });

    expect(screen.getByRole('header', { name: 'No documents yet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add Document' })).toBeTruthy();
  });

  test('with reduced motion on, is simply there, without waiting out the animation', async () => {
    const { fabric } = await renderThemed(EmptyState, { inputs, providers: [withReducedMotion] });

    // The setting is reported a moment after the first frame, and the entrance is then cut short:
    // it is at rest well inside the time the animation itself would take.
    await waitFor(() => expect(arrived(entranceGroups(fabric.committed))).toBe(true), {
      timeout: motion.duration.normal / 2,
    });
    expect(entranceGroups(fabric.committed)).toHaveLength(1);
  });

  test('can be taken away while it is arriving, without a trace', async () => {
    const { unmount } = await renderThemed(EmptyState, { inputs });

    expect(() => unmount()).not.toThrow();
  });
});
