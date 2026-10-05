import { Injectable, inject } from '@angular/core';
import type { CollectionId } from '../types/collection.ts';
import type { DocumentFileType, DocumentItem } from '../types/document-item.ts';
import { generateId } from '../../shared/utils/id.ts';
import { POCKIT_DATABASE } from './pockit-database.ts';

/** A row as SQLite hands it back: `snake_case`, and a 0/1 in place of a boolean. */
interface DocumentRow {
  readonly id: string;
  readonly title: string;
  readonly collection_id: CollectionId;
  readonly file_type: DocumentFileType;
  readonly file_uri: string;
  readonly is_favorite: number;
  readonly created_at: number;
  readonly updated_at: number;
}

function fromRow(row: DocumentRow): DocumentItem {
  return {
    id: row.id,
    title: row.title,
    collectionId: row.collection_id,
    fileType: row.file_type,
    fileUri: row.file_uri,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface NewDocument {
  readonly title: string;
  readonly collectionId: CollectionId;
  readonly fileType: DocumentFileType;
  readonly fileUri: string;
}

/**
 * The one table the vault has so far. `VaultStore` is what a feature talks to; this is the only
 * place that writes SQL, per the rule that a feature never talks to the database directly.
 */
@Injectable({ providedIn: 'root' })
export class DocumentsRepository {
  private readonly database = inject(POCKIT_DATABASE);

  async insert(input: NewDocument): Promise<DocumentItem> {
    const db = await this.database.ready();
    const now = Date.now();
    const item: DocumentItem = { id: generateId(), isFavorite: false, createdAt: now, updatedAt: now, ...input };
    await db.runAsync(
      `INSERT INTO document (id, title, collection_id, file_type, file_uri, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.title,
        item.collectionId,
        item.fileType,
        item.fileUri,
        item.isFavorite ? 1 : 0,
        item.createdAt,
        item.updatedAt,
      ],
    );
    return item;
  }

  /**
   * Every document, newest first. `rowid` (SQLite's own, implicit) breaks a tie in `created_at`,
   * which two saves a millisecond apart really can share.
   */
  async list(): Promise<readonly DocumentItem[]> {
    const db = await this.database.ready();
    const rows = await db.getAllAsync<DocumentRow>(
      'SELECT * FROM document ORDER BY created_at DESC, rowid DESC',
      [],
    );
    return rows.map(fromRow);
  }
}
