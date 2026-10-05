import type { Provider } from '@angular/core';
import type { FakeFabricNode } from '@ng-native/testing';
import { Accessibility } from '@ng-native/device';
import { nodesOf } from './tree.ts';

/** Turns "reduce motion" on, the way the system setting would, for a test. */
export const withReducedMotion: Provider = {
  provide: Accessibility.SOURCE,
  useValue: {
    current: async () => ({ screenReader: false, reduceMotion: true, boldText: false, fontScale: 1 }),
    subscribe: () => () => undefined,
    announce: () => undefined,
  },
};

type Transform = readonly Record<string, unknown>[] | undefined;

function transformOf(node: FakeFabricNode): Transform {
  return node.props['transform'] as Transform;
}

/** The scale a node is drawn at: one when it has none. */
export function scaleOf(node: FakeFabricNode): number {
  const entry = transformOf(node)?.find((item) => 'scale' in item);
  return typeof entry?.['scale'] === 'number' ? entry['scale'] : 1;
}

/** The opacity a node is drawn at: one when it has none. */
export function opacityOf(node: FakeFabricNode): number {
  const opacity = node.props['opacity'];
  return typeof opacity === 'number' ? opacity : 1;
}

/** How far a node is still to rise to its place: zero once an entrance is over. */
export function riseOf(node: FakeFabricNode): number {
  const entry = transformOf(node)?.find((item) => 'translateY' in item);
  return typeof entry?.['translateY'] === 'number' ? entry['translateY'] : 0;
}

/** The groups of an entrance under some nodes: every view that rises into place, in tree order. */
export function entranceGroups(nodes: readonly FakeFabricNode[]): FakeFabricNode[] {
  return nodesOf(nodes).filter((node) => transformOf(node)?.some((item) => 'translateY' in item));
}

/** Whether every group of an entrance has arrived: fully opaque and in place. */
export function arrived(groups: readonly FakeFabricNode[]): boolean {
  return groups.every((group) => opacityOf(group) === 1 && riseOf(group) === 0);
}
