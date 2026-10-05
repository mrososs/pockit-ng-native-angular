import type { CollectionId } from './collection.ts';
import type { DocumentFileType } from './document-item.ts';

/**
 * What a thumbnail shows. Today only the design's placeholder artwork exists, named by its tone.
 * When documents carry real images this gains a `{ uri }` alternative and the artwork becomes the
 * fallback for a document with none.
 */
export interface ThumbnailSource {
  readonly tone: ThumbnailTone;
}

/** The placeholder artwork palettes of the design: a redacted page on a coloured ground. */
export type ThumbnailTone = 'indigo' | 'teal' | 'rose' | 'paper' | 'sky' | 'ochre';

/** A document, as far as a card needs to draw it. Not the stored document: that comes later. */
export interface DocumentPreview {
  readonly id: string;
  readonly title: string;
  /** What it is, under the title: "ID · Front & back", "PDF · 1 page". */
  readonly kind: string;
  readonly thumbnail: ThumbnailSource;
  /** A short label on the thumbnail: "2 pages", "PDF". */
  readonly badge?: string;
  readonly favorite: boolean;
  /** Which collection it belongs to: a search result's own line, a collection page's own grid. */
  readonly collectionId: CollectionId;
  /** Where the real file is, and what kind it is: what the document viewer opens (Phase 9). */
  readonly fileUri: string;
  readonly fileType: DocumentFileType;
}
