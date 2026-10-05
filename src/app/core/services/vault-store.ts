import { Injectable, type Signal, inject, signal } from '@angular/core';
import { DocumentsRepository, type NewDocument } from '../storage/documents-repository.ts';
import type { CollectionId } from '../types/collection.ts';
import type { DocumentItem } from '../types/document-item.ts';
import type { DocumentPreview, ThumbnailSource, ThumbnailTone } from '../types/document-preview.ts';
import { EMPTY_VAULT, type VaultOverview } from './vault-overview.ts';

/** Rotated through by an item's place in the list, until there is a real thumbnail to show. */
const TONES: readonly ThumbnailTone[] = ['indigo', 'teal', 'rose', 'paper', 'sky', 'ochre'];

/**
 * The vault's live state: every screen that only reads it injects `VAULT_OVERVIEW`; this is for
 * the one screen (Review) that adds to it. Loads once, on first use, and recomputes after every
 * write - there is no reactive query, so a write that does not go through `save` will not be seen.
 */
@Injectable({ providedIn: 'root' })
export class VaultStore {
  private readonly repository = inject(DocumentsRepository);

  private readonly state = signal<VaultOverview>(EMPTY_VAULT);
  readonly overview: Signal<VaultOverview> = this.state.asReadonly();

  constructor() {
    // Nothing awaits construction, so a database that fails to open (not installed, under test;
    // broken, on a device) must not become an unhandled rejection: the vault just stays empty,
    // which is what `EMPTY_VAULT` already is for.
    void this.refresh().catch(() => {});
  }

  /** Re-reads every document and recomputes the overview from it. */
  async refresh(): Promise<void> {
    const documents = await this.repository.list();
    this.state.set(overviewOf(documents));
  }

  /** Saves a new document and refreshes, so `VAULT_OVERVIEW` reflects it immediately after. */
  async save(input: NewDocument): Promise<DocumentItem> {
    const item = await this.repository.insert(input);
    await this.refresh();
    return item;
  }
}

function overviewOf(documents: readonly DocumentItem[]): VaultOverview {
  const counts: Record<CollectionId, number> = { 'personal-documents': 0, certificates: 0, important: 0 };
  const peeks: Partial<Record<CollectionId, ThumbnailSource[]>> = {};
  const documentsByCollection: Partial<Record<CollectionId, DocumentPreview[]>> = {};

  const previews = documents.map((item, index) => toPreview(item, index));

  documents.forEach((item, index) => {
    counts[item.collectionId]++;
    const peek = (peeks[item.collectionId] ??= []);
    if (peek.length < 2) {
      peek.push({ tone: TONES[index % TONES.length]! });
    }
    (documentsByCollection[item.collectionId] ??= []).push(previews[index]!);
  });

  return {
    counts,
    // Nothing sets `isFavorite` yet - there is no document viewer to hold the action (Phase 9) -
    // so this is always empty today, correctly so.
    favorites: previews.filter((preview) => preview.favorite),
    peeks,
    documents: previews,
    documentsByCollection,
  };
}

function toPreview(item: DocumentItem, index: number): DocumentPreview {
  return {
    id: item.id,
    title: item.title,
    kind: kindOf(item),
    thumbnail: { tone: TONES[index % TONES.length]! },
    badge: item.fileType === 'pdf' ? 'PDF' : undefined,
    favorite: item.isFavorite,
    collectionId: item.collectionId,
  };
}

function kindOf(item: DocumentItem): string {
  switch (item.fileType) {
    case 'image':
      return 'Photo';
    case 'pdf':
      return 'PDF';
    default:
      return 'Document';
  }
}

