import { type FakeFabric, type FakeFabricNode, fireEvent } from '@ng-native/testing';
import { named } from './tree.ts';

/** The native screen of one tab, by the `path` its `<native-tab>` names. */
export function tabScreen(fabric: FakeFabric, key: string): FakeFabricNode {
  const screen = named(fabric.committed, 'RNSTabsScreenIOS').find(
    (tab) => tab.props['screenKey'] === key,
  );
  if (!screen) {
    throw new Error(`no tab "${key}" in the tab bar`);
  }
  return screen;
}

/** Selects a tab as the native tab bar does when it is tapped. */
export async function selectTab(fabric: FakeFabric, key: string): Promise<void> {
  const bar = fabric.find('RNSTabsHostIOS');
  if (!bar) {
    throw new Error('no tab bar is on screen');
  }
  await fireEvent(bar, 'tabSelected', { selectedScreenKey: key, provenance: 1 });
}

/** The tab the router last asked native to show. */
export function requestedTab(fabric: FakeFabric): unknown {
  const request = fabric.find('RNSTabsHostIOS')?.props['navStateRequest'] as
    | { selectedScreenKey?: unknown }
    | undefined;
  return request?.selectedScreenKey;
}
