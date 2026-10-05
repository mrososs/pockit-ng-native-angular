import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { waitFor } from '@ng-native/testing';
import { describe, expect, test } from 'vitest';
import { VAULT_OVERVIEW } from '../core/services/vault-overview.ts';
import { PREVIEW_VAULT } from '../preview/preview-vault.ts';
import { tabScreen } from '../testing/navigation.ts';
import { renderApp } from '../testing/render.ts';
import { headerTitles, named, nodesOf } from '../testing/tree.ts';

/**
 * Where content stops, so that nothing hides behind the status bar, a native header, or the tab
 * bar. Native lays these out, so what a test can hold is who owns each inset: the status bar's
 * (and only where there is no native header), and the tab bar's, from the tab screen itself.
 */
describe('a tab\'s first page, which has no native header', () => {
  test('insets for the status bar at the top, and nothing else', async () => {
    const { fabric } = await renderApp();

    const [top] = named(tabScreen(fabric, 'home').children, 'RNCSafeAreaView');

    expect(top?.props['edges']).toEqual({
      top: 'additive',
      right: 'off',
      bottom: 'off',
      left: 'off',
    });
  });

  test('leaves the bottom to the tab screen, which knows what the bar covers', async () => {
    const { fabric } = await renderApp();

    const [bottom] = named(tabScreen(fabric, 'home').children, 'RNSSafeAreaView');

    expect(bottom?.props['edges']).toMatchObject({ top: false, bottom: true });
  });

  test('hides the native header, so nothing clears the top twice', async () => {
    const { fabric } = await renderApp();

    const headers = named(tabScreen(fabric, 'home').children, 'RNSScreenStackHeaderConfig');

    expect(headers).toHaveLength(1);
    expect(headers[0]?.props['hidden']).toBe(true);
  });

  test('scrolls inside the bottom inset, so its last row clears the bar', async () => {
    const { fabric } = await renderApp();

    const [bottom] = named(tabScreen(fabric, 'home').children, 'RNSSafeAreaView');

    expect(named(bottom!.children, 'ScrollView')).toHaveLength(1);
  });

  test('keeps the floating add button inside the bottom inset, reachable above the bar', async () => {
    const { fabric } = await renderApp({
      providers: [{ provide: VAULT_OVERVIEW, useValue: signal(PREVIEW_VAULT).asReadonly() }],
    });

    const [bottom] = named(tabScreen(fabric, 'home').children, 'RNSSafeAreaView');
    const inside = nodesOf(bottom!.children).filter(
      (node) => node.props['accessibilityLabel'] === 'Add document',
    );

    expect(inside).toHaveLength(1);
  });
});

describe('a pushed page, which has a native header', () => {
  test('lets the header own the top inset, and keeps only the bottom one', async () => {
    const { fabric, componentRef } = await renderApp();

    await componentRef.injector.get(Router).navigateByUrl('/collections/important');
    await waitFor(() => expect(headerTitles(fabric.committed)).toContain('Important'));

    const detail = tabScreen(fabric, 'collections').children;
    expect(named(detail, 'RNCSafeAreaView')).toHaveLength(0);
    expect(named(detail, 'RNSSafeAreaView').length).toBeGreaterThan(0);
    const header = named(detail, 'RNSScreenStackHeaderConfig').find(
      (node) => node.props['title'] === 'Important',
    );
    expect(header?.props['hidden']).toBeUndefined();
  });
});
