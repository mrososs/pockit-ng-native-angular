import { InjectionToken, type Signal, inject } from '@angular/core';
import type { CollectionId } from '../types/collection.ts';
import type { DocumentPreview, ThumbnailSource } from '../types/document-preview.ts';
import { VaultStore } from './vault-store.ts';

/**
 * What the screens need to know about the vault's contents, and nothing more: how many documents
 * each collection holds, which are favourites, and what to peek at on a collection's card.
 *
 * It is a read-only view for presentation. `VaultStore` is what computes it from the database
 * (Phase 7); the default below is an empty vault, which is what a fresh database holds anyway.
 */
export interface VaultOverview {
  readonly counts: Readonly<Record<CollectionId, number>>;
  /** Favourite documents, in the order they are shown. */
  readonly favorites: readonly DocumentPreview[];
  /** Up to two thumbnails to peek out of a collection's large card. */
  readonly peeks: Readonly<Partial<Record<CollectionId, readonly ThumbnailSource[]>>>;
  /** Every document, newest first - what Search filters and a collection's page grids. */
  readonly documents: readonly DocumentPreview[];
  /** `documents`, grouped by collection, in the same order. */
  readonly documentsByCollection: Readonly<Partial<Record<CollectionId, readonly DocumentPreview[]>>>;
}

export const EMPTY_VAULT: VaultOverview = {
  counts: { 'personal-documents': 0, certificates: 0, important: 0 },
  favorites: [],
  peeks: {},
  documents: [],
  documentsByCollection: {},
};

/**
 * The vault the app is showing. `VaultStore`'s, by default; tests and the dev preview provide
 * another. Not `VaultStore.overview` taken directly, so a screen that only reads the vault never
 * has to know there is a store behind it, or inject something that can also write.
 */
export const VAULT_OVERVIEW = new InjectionToken<Signal<VaultOverview>>('VAULT_OVERVIEW', {
  providedIn: 'root',
  factory: () => inject(VaultStore).overview,
});

/** How many documents there are in all. */
export function totalDocuments(overview: VaultOverview): number {
  return Object.values(overview.counts).reduce((sum, count) => sum + count, 0);
}
