import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Database } from '@ng-native/expo/database';
import { MIGRATIONS, type PockitDatabase } from '../core/storage/pockit-database.ts';

/** The repository only ever binds plain values; node:sqlite's own type is just pickier about it. */
const asParams = (params: readonly unknown[]) => params as readonly SQLInputValue[];

/**
 * A real SQLite database, in memory, wrapped in the same async shape `PockitDatabase` expects.
 *
 * `expo-sqlite` is native-backed and cannot run under Node, so a test needs something else that
 * actually executes SQL - a hand-written fake would have to reimplement it. Node's own `sqlite`
 * module does the same job synchronously; this only adds the `Promise.resolve()` the interface
 * asks for.
 */
export function fakeSqliteDatabase(): PockitDatabase {
  const db = new DatabaseSync(':memory:');
  return {
    async execAsync(source) {
      db.exec(source);
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]) {
      const bound = params.length === 1 && Array.isArray(params[0]) ? (params[0] as unknown[]) : params;
      return (db.prepare(source).get(...asParams(bound)) ?? null) as T | null;
    },
    async getAllAsync<T>(source: string, params: readonly unknown[] = []) {
      return db.prepare(source).all(...asParams(params)) as T[];
    },
    async runAsync(source: string, params: readonly unknown[] = []) {
      const result = db.prepare(source).run(...asParams(params));
      return { changes: Number(result.changes) };
    },
    async closeAsync() {
      db.close();
    },
    async withTransactionAsync(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

/**
 * A `POCKIT_DATABASE` provider value, migrated against the real schema on the real (if in-memory)
 * engine: `{ provide: POCKIT_DATABASE, useValue: fakeDatabase() }`.
 */
export function fakeDatabase(): Database<PockitDatabase> {
  return new Database(async () => fakeSqliteDatabase(), MIGRATIONS);
}
