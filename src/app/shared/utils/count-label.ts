/** "6 documents", "1 document", and "Empty" for none. */
export function documentCountLabel(count: number): string {
  if (count === 0) {
    return 'Empty';
  }
  return count === 1 ? '1 document' : `${count} documents`;
}
