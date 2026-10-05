import { screen, userEvent } from '@ng-native/testing';
import { describe, expect, test, vi } from 'vitest';
import { renderThemed } from '../../../testing/render.ts';
import { named } from '../../../testing/tree.ts';
import { EmptyState } from './empty-state.ts';

describe('EmptyState', () => {
  test('shows its title as a heading', async () => {
    await renderThemed(EmptyState, { inputs: { title: 'No documents yet' } });

    expect(screen.getByRole('header', { name: 'No documents yet' })).toBeTruthy();
  });

  test('shows the line under the title only when it is given one', async () => {
    const { rerender } = await renderThemed(EmptyState, { inputs: { title: 'No documents yet' } });
    expect(screen.queryByText('Add your first one.')).toBeNull();

    await rerender({ inputs: { message: 'Add your first one.' } });

    expect(screen.getByText('Add your first one.')).toBeTruthy();
  });

  test('shows an icon tile only when it is given an icon', async () => {
    const { fabric, rerender } = await renderThemed(EmptyState, { inputs: { title: 'Nothing' } });
    expect(named(fabric.committed, 'Image')).toHaveLength(0);

    await rerender({ inputs: { icon: 'id-card' } });

    expect(named(fabric.committed, 'Image')).toHaveLength(1);
  });

  test('offers its action as a button, and reports a press', async () => {
    const action = vi.fn();
    await renderThemed(EmptyState, {
      inputs: { title: 'No documents yet', actionLabel: 'Add Document' },
      on: { action },
    });

    await userEvent.press(screen.getByRole('button', { name: 'Add Document' }));

    expect(action).toHaveBeenCalledTimes(1);
  });

  test('has no button when it has nothing to offer', async () => {
    await renderThemed(EmptyState, { inputs: { title: 'No documents yet' } });

    expect(screen.queryByRole('button')).toBeNull();
  });
});
