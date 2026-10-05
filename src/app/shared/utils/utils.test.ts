import { describe, expect, test } from 'vitest';
import { chunk } from './chunk.ts';
import { documentCountLabel } from './count-label.ts';

describe('documentCountLabel', () => {
  test.each([
    [0, 'Empty'],
    [1, '1 document'],
    [2, '2 documents'],
    [48, '48 documents'],
  ])('%i is "%s"', (count, label) => {
    expect(documentCountLabel(count)).toBe(label);
  });
});

describe('chunk', () => {
  test('splits into rows in order, the last one short', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('gives no rows for no items', () => {
    expect(chunk([], 2)).toEqual([]);
  });

  test('does not change what it is given', () => {
    const items = [1, 2, 3];
    chunk(items, 2);
    expect(items).toEqual([1, 2, 3]);
  });
});
