/** Splits a list into rows of at most `size`, in order: `[1, 2, 3]` by 2 is `[[1, 2], [3]]`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    rows.push(items.slice(start, start + size));
  }
  return rows;
}
