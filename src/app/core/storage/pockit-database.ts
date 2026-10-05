import { InjectionToken } from '@angular/core';
import { expoModule } from '@ng-native/expo';
import { Database, type Migration, type NativeDatabase } from '@ng-native/expo/database';

/** The slice of `expo-sqlite`'s `SQLiteDatabase` the repositories need. */
export interface PockitDatabase extends NativeDatabase {
  runAsync(source: string, params: readonly unknown[]): Promise<{ readonly changes: number }>;
  getAllAsync<T>(source: string, params: readonly unknown[]): Promise<T[]>;
}

/** Exported for `testing/sqlite.ts`, so a test runs the same schema a device would. */
export const MIGRATIONS: readonly Migration[] = [
  {
    to: 1,
    up: (db) =>
      db.execAsync(`
        CREATE TABLE document (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          collection_id TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_uri TEXT NOT NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `),
  },
];

/**
 * The vault's one database: a single `document` table (section 16's data direction, settled for
 * Phase 7 as one file per document - no child table for a multi-page document yet, since nothing
 * builds a second page). Collections are not a table: the three predefined ones are still
 * `core/config`, unchanged since Phase 3, and custom collections remain out of scope.
 *
 * Overridden in a test with an in-memory database (`testing/sqlite.ts`) rather than faked by hand:
 * a hand-written fake would have to reimplement SQL, and that is not a thing worth re-trusting.
 */
export const POCKIT_DATABASE = new InjectionToken<Database<PockitDatabase>>('pockit.database', {
  factory: () =>
    new Database(async () => {
      const expo = expoModule('expo-sqlite', () => require('expo-sqlite'));
      if (!expo) {
        throw new Error('[pockit] expo-sqlite is not installed');
      }
      return expo.openDatabaseAsync('pockit.db') as Promise<PockitDatabase>;
    }, MIGRATIONS),
});
