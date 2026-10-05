import { Router } from '@angular/router';
import { waitFor, within } from '@ng-native/testing';
import { NativeNavigation } from '@ng-native/router';
import { describe, expect, test } from 'vitest';
import { motion } from '../../shared/theme/theme.ts';
import { arrived, entranceGroups, withReducedMotion } from '../../testing/motion.ts';
import { selectTab, tabScreen } from '../../testing/navigation.ts';
import { renderApp } from '../../testing/render.ts';
import { headerTitles, named, textOf } from '../../testing/tree.ts';

describe('the Collections entrance', () => {
  async function openCollections() {
    const rendered = await renderApp();
    await selectTab(rendered.fabric, 'collections');
    await waitFor(() =>
      expect(within(tabScreen(rendered.fabric, 'collections')).getByRole('header', { name: 'Collections' })).toBeTruthy(),
    );
    return rendered;
  }

  test('is three groups, in the order they appear: the title, the featured row, the rest', async () => {
    const { fabric } = await openCollections();

    const [title, featured, rest] = entranceGroups(tabScreen(fabric, 'collections').children);

    expect(entranceGroups(tabScreen(fabric, 'collections').children)).toHaveLength(3);
    expect(textOf(title!)).toContain('collections');
    expect(textOf(featured!)).toContain('Personal Documents');
    expect(textOf(rest!)).toContain('Certificates');
    expect(textOf(rest!)).not.toContain('Personal Documents');
  });

  test('is the language of Home, with less of it: the same motion at the light intensity', async () => {
    const { fabric } = await openCollections();

    const groups = entranceGroups(tabScreen(fabric, 'collections').children);

    // Before it has arrived, a group is as far down as the light entrance says, not the full one.
    const farthest = Math.max(...groups.map((group) => riseOf(group)));
    expect(farthest).toBeLessThanOrEqual(motion.enter.light.rise);
    expect(motion.enter.light.rise).toBeLessThan(motion.enter.full.rise);

    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true));
  });

  test('plays when the tab is first opened, and not again on a return to it', async () => {
    const { fabric } = await openCollections();
    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true));

    await selectTab(fabric, 'home');
    await selectTab(fabric, 'collections');

    expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true);
  });

  test('survives quick tab switches while it is arriving', async () => {
    const { fabric } = await renderApp();

    for (let lap = 0; lap < 3; lap++) {
      await selectTab(fabric, 'collections');
      await selectTab(fabric, 'home');
    }
    await selectTab(fabric, 'collections');

    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true));
    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'home').children))).toBe(true));
  });

  test('with reduced motion on, is at rest without waiting out the animation', async () => {
    const { fabric } = await renderApp({ providers: [withReducedMotion] });
    await selectTab(fabric, 'collections');

    await waitFor(
      () => expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true),
      { timeout: motion.duration.normal / 2 },
    );
  });
});

describe('the Collection Detail entrance', () => {
  test('animates its content only: the empty state is the one group', async () => {
    const { fabric, componentRef } = await renderApp();

    await componentRef.injector.get(Router).navigateByUrl('/collections/certificates');
    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));

    const groups = entranceGroups(tabScreen(fabric, 'collections').children).filter((group) =>
      textOf(group).includes('No documents yet'),
    );

    expect(groups).toHaveLength(1);
    await waitFor(() => expect(arrived(entranceGroups(tabScreen(fabric, 'collections').children))).toBe(true));
  });

  test('leaves the native header out of every animated group', async () => {
    const { fabric, componentRef } = await renderApp();

    await componentRef.injector.get(Router).navigateByUrl('/collections/certificates');
    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));

    expect(named(fabric.committed, 'RNSScreenStackHeaderConfig').length).toBeGreaterThan(0);
    for (const group of entranceGroups(fabric.committed)) {
      expect(named(group.children, 'RNSScreenStackHeaderConfig')).toEqual([]);
    }
  });

  test('can be left with Back while it is arriving, and the list is as it was', async () => {
    const { fabric, componentRef } = await renderApp();
    const router = componentRef.injector.get(Router);

    // Pushed from the list, as a press on a card does, so the list is beneath it for Back.
    await selectTab(fabric, 'collections');
    await componentRef.injector.get(NativeNavigation).push(['/collections', 'certificates']);
    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Certificates'));
    // Back at once: the entrance has barely begun.
    componentRef.injector.get(NativeNavigation).back();

    // The router is back on the list, and the stack is still the native one.
    await waitFor(() => expect(router.url).toBe('/collections'));
    expect(named(fabric.committed, 'RNSScreenStack').length).toBeGreaterThan(0);
    expect(within(tabScreen(fabric, 'collections')).getByRole('header', { name: 'Collections' })).toBeTruthy();
  });
});

function riseOf(group: Parameters<typeof arrived>[0][number]): number {
  const transform = group.props['transform'] as readonly Record<string, unknown>[] | undefined;
  const entry = transform?.find((item) => 'translateY' in item);
  return typeof entry?.['translateY'] === 'number' ? entry['translateY'] : 0;
}
