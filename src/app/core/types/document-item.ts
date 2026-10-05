import type { CollectionId } from './collection.ts';

/**
 * What kind of file a document holds. Drives the badge ("PDF") and, until there is a real
 * thumbnail, which placeholder tone it takes (`core/services/vault-store.ts`).
 */
export type DocumentFileType = 'image' | 'pdf' | 'other';

/**
 * A saved document: the vault's own record, not what a card needs to draw (`DocumentPreview` is
 * that half). One file per document today - a National ID's front and back, or any other
 * multi-page document, is the design's "Add another page" and multi-page screen, not yet scheduled
 * to a phase; the shape here does not yet have anywhere to put a second file.
 */
export interface DocumentItem {
  readonly id: string;
  readonly title: string;
  readonly collectionId: CollectionId;
  readonly fileType: DocumentFileType;
  /** Where `VaultFiles` copied it to. Permanent: the vault's own storage, not the picker's. */
  readonly fileUri: string;
  readonly isFavorite: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** What `fileType` a picker's MIME type makes. Unknown and missing types are `'other'`. */
export function fileTypeOf(mimeType: string | null | undefined): DocumentFileType {
  if (mimeType?.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  return 'other';
}
