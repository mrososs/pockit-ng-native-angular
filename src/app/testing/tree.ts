import type { FakeFabricNode } from '@ng-native/testing';

/** Every node of a committed tree, parents before children. */
export function nodesOf(nodes: readonly FakeFabricNode[]): FakeFabricNode[] {
  return nodes.flatMap((node) => [node, ...nodesOf(node.children)]);
}

/** The nodes of one native view name. */
export function named(nodes: readonly FakeFabricNode[], viewName: string): FakeFabricNode[] {
  return nodesOf(nodes).filter((node) => node.viewName === viewName);
}

/** The titles of the native headers on screen. A hidden header has none. */
export function headerTitles(nodes: readonly FakeFabricNode[]): unknown[] {
  return named(nodes, 'RNSScreenStackHeaderConfig')
    .map((header) => header.props['title'])
    .filter((title) => title !== undefined);
}

/** The text a node and everything under it shows. */
export function textOf(node: FakeFabricNode): string {
  const own = node.viewName === 'RawText' ? String(node.props['text'] ?? '') : '';
  return own + node.children.map(textOf).join('');
}

/**
 * What a pressable shows: its first child. A pressable is the touch target and the accessibility
 * element and holds still, so its size and colour are on the view inside it, which is also the one
 * that dips when pressed.
 */
export function visualOf(pressable: FakeFabricNode): FakeFabricNode {
  const [visual] = pressable.children;
  if (visual === undefined) {
    throw new Error('the pressable has no visual inside it');
  }
  return visual;
}

/** How the engine writes a colour it resolved from a token: `#15191B` as `rgb(21, 25, 27)`. */
export function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
