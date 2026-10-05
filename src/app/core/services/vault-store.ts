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

  /** The viewer's own action (Phase 9): sets a document's favourite, then refreshes. */
  async setFavorite(id: string, favorite: boolean): Promise<void> {
    await this.repository.setFavorite(id, favorite);
    await this.refresh();
  }

  /** The viewer's "Edit" (Phase 11): renames a document and/or moves it, then refreshes. */
  async update(id: string, changes: { readonly title: string; readonly collectionId: CollectionId }): Promise<void> {
    await this.repository.update(id, changes);
    await this.refresh();
  }

  /** The viewer's "More" (Phase 11): deletes a document's row, then refreshes. The vault file
   * itself is the caller's: `VaultFiles.remove`, the same split `Review`'s own cancel makes. */
  async remove(id: string): Promise<void> {
    await this.repository.remove(id);
    await this.refresh();
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
    fileUri: item.fileUri,
    fileType: item.fileType,
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

