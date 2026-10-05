import { InjectionToken, type Signal, signal } from '@angular/core';
import type { CollectionId } from '../types/collection.ts';
import type { DocumentPreview, ThumbnailSource } from '../types/document-preview.ts';

/**
 * What the screens need to know about the vault's contents, and nothing more: how many documents
 * each collection holds, which are favourites, and what to peek at on a collection's card.
 *
 * It is a read-only view for presentation. The persistence phase replaces its provider with one
 * backed by the database; until then the default below is an empty vault, which is the truth.
 */
export interface VaultOverview {
  readonly counts: Readonly<Record<CollectionId, number>>;
  /** Favourite documents, in the order they are shown. */
  readonly favorites: readonly DocumentPreview[];
  /** Up to two thumbnails to peek out of a collection's large card. */
  readonly peeks: Readonly<Partial<Record<CollectionId, readonly ThumbnailSource[]>>>;
}

export const EMPTY_VAULT: VaultOverview = {
  counts: { 'personal-documents': 0, certificates: 0, important: 0 },
  favorites: [],
  peeks: {},
};

/** The vault the app is showing. Empty by default; tests and the dev preview provide another. */
export const VAULT_OVERVIEW = new InjectionToken<Signal<VaultOverview>>('VAULT_OVERVIEW', {
  providedIn: 'root',
  factory: () => signal(EMPTY_VAULT).asReadonly(),
});

/** How many documents there are in all. */
export function totalDocuments(overview: VaultOverview): number {
  return Object.values(overview.counts).reduce((sum, count) => sum + count, 0);
}
