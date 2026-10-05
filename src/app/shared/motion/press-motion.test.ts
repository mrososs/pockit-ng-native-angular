import type { Type } from '@angular/core';
import { fireEvent, screen, waitFor } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { PREDEFINED_COLLECTIONS } from '../../core/config/predefined-collections.ts';
import { PREVIEW_VAULT } from '../../preview/preview-vault.ts';
import { opacityOf, scaleOf, withReducedMotion } from '../../testing/motion.ts';
import { renderThemed } from '../../testing/render.ts';
import { visualOf } from '../../testing/tree.ts';
import { AddAction } from '../components/add-action/add-action.ts';
import { Button } from '../components/button/button.ts';
import { CollectionCard } from '../components/collection-card/collection-card.ts';
import { DocumentCard } from '../components/document-card/document-card.ts';
import { SearchTrigger } from '../components/search-trigger/search-trigger.ts';
import { type PressRole, motion } from '../theme/theme.ts';

const [personal] = PREDEFINED_COLLECTIONS as [(typeof PREDEFINED_COLLECTIONS)[number]];
const [favorite] = PREVIEW_VAULT.favorites as [(typeof PREVIEW_VAULT.favorites)[number]];

interface PressCase {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly inputs: Record<string, unknown>;
  readonly role: PressRole;
}

/** Everything that is pressed, with the role its press takes. */
const pressables: readonly PressCase[] = [
  { name: 'Button', component: Button, inputs: { label: 'Add document' }, role: 'control' },
  { name: 'SearchTrigger', component: SearchTrigger, inputs: {}, role: 'control' },
  { name: 'AddAction', component: AddAction, inputs: {}, role: 'round' },
  { name: 'DocumentCard', component: DocumentCard, inputs: { document: favorite }, role: 'card' },
  {
    name: 'CollectionCard, secondary',
    component: CollectionCard,
    inputs: { collection: personal, variant: 'secondary' },
    role: 'card',
  },
  {
    name: 'CollectionCard, primary',
    component: CollectionCard,
    inputs: { collection: personal, variant: 'primary' },
    role: 'surface',
  },
  {
    name: 'CollectionCard, featured',
    component: CollectionCard,
    inputs: { collection: personal, variant: 'featured' },
    role: 'surface',
  },
  {
    name: 'CollectionCard, compact',
    component: CollectionCard,
    inputs: { collection: personal, variant: 'compact' },
    role: 'surface',
  },
];

const button = () => screen.getByRole('button');
const visual = () => visualOf(button());

/** Waits for a number to settle at a value, to the precision a screen could show. */
async function toSettleAt(read: () => number, expected: number): Promise<void> {
  await waitFor(() => expect(read()).toBeCloseTo(expected, 2));
}

describe.each(pressables)('pressing $name', ({ component, inputs, role }) => {
  const dip = motion.press.role[role].scale;

  test('is wired: the finger going down dips and dims its visual', async () => {
    await renderThemed(component, { inputs });

    await fireEvent(button(), 'pressIn');

    await toSettleAt(() => scaleOf(visual()), dip);
    await toSettleAt(() => opacityOf(visual()), motion.press.opacity);
  });

  test('and coming back lets it return to rest', async () => {
    await renderThemed(component, { inputs });

    await fireEvent(button(), 'pressIn');
    await toSettleAt(() => scaleOf(visual()), dip);
    await fireEvent(button(), 'pressOut');

    await toSettleAt(() => scaleOf(visual()), 1);
    await toSettleAt(() => opacityOf(visual()), 1);
  });

  test('never moves or resizes the touch target', async () => {
    await renderThemed(component, { inputs });
    const before = { ...button().props };

    await fireEvent(button(), 'pressIn');
    await toSettleAt(() => scaleOf(visual()), dip);

    // The pressable carries no style that the press could write: it holds still, and only the view
    // inside it dips, so the area a finger can hit is the same at rest and under the finger.
    for (const key of ['transform', 'opacity', 'width', 'height', 'minHeight', 'style']) {
      expect(button().props[key]).toBe(before[key]);
    }
    expect(button().props['transform']).toBeUndefined();
  });

  test('keeps its role and label for assistive technology', async () => {
    await renderThemed(component, { inputs });

    expect(button().props['accessibilityRole']).toBe('button');
    expect(button().props['accessibilityLabel']).toEqual(expect.any(String));
    expect(button().props['accessibilityLabel']).not.toBe('');
  });

  test('survives a flurry of presses, and ends at rest', async () => {
    await renderThemed(component, { inputs });

    for (let tap = 0; tap < 6; tap++) {
      await fireEvent(button(), 'pressIn');
      await fireEvent(button(), 'pressOut');
    }

    await toSettleAt(() => scaleOf(visual()), 1);
    await toSettleAt(() => opacityOf(visual()), 1);
  });

  test('can be taken away mid-press, without a trace', async () => {
    const { unmount } = await renderThemed(component, { inputs });

    await fireEvent(button(), 'pressIn');

    expect(() => unmount()).not.toThrow();
  });

  test('with reduced motion on, dims and does not dip', async () => {
    await renderThemed(component, { inputs, providers: [withReducedMotion] });

    await fireEvent(button(), 'pressIn');

    await toSettleAt(() => opacityOf(visual()), motion.press.opacity);
    expect(scaleOf(visual())).toBe(1);
  });
});

describe('a press that is interrupted', () => {
  test('goes back from where it had got to, not from the start', async () => {
    await renderThemed(AddAction);

    await fireEvent(button(), 'pressIn');
    await fireEvent(button(), 'pressOut');
    // Pressed again before it had finished coming back.
    await fireEvent(button(), 'pressIn');

    await toSettleAt(() => scaleOf(visual()), motion.press.role.round.scale);
  });
});
