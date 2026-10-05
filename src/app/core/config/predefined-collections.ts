import type { CollectionDefinition } from '../types/collection.ts';

/**
 * The collections every vault starts with, in display order. Home, Collections and the collection
 * page all read this one list. Custom collections are a later phase; they will join it at runtime
 * rather than by editing this file.
 */
export const PREDEFINED_COLLECTIONS: readonly CollectionDefinition[] = [
  {
    id: 'personal-documents',
    name: 'Personal Documents',
    description: 'IDs, passport & licenses',
    icon: 'id-card',
  },
  {
    id: 'certificates',
    name: 'Certificates',
    description: 'Degrees & courses',
    icon: 'award',
  },
  {
    id: 'important',
    name: 'Important',
    description: 'Receipts & key papers',
    icon: 'flag',
  },
];

/** The collection with this id, or `undefined` for one that does not exist (a stale link, say). */
export function findCollection(id: string | null | undefined): CollectionDefinition | undefined {
  return PREDEFINED_COLLECTIONS.find((collection) => collection.id === id);
}
