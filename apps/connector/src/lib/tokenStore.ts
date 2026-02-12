/**
 * Token persistence with AES-256-GCM encryption at rest.
 * Uses SQLite via better-sqlite3 for synchronous, single-process storage.
 */

import Database from 'better-sqlite3';
import { encrypt, decrypt } from './crypto.js';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  openId: string;
  sellerName?: string;
}

export interface TokenStore {
  get(installId: string): StoredTokens | null;
  upsert(installId: string, tokens: StoredTokens): void;
  delete(installId: string): boolean;
  hasTokens(installId: string): boolean;
}

export class SqliteTokenStore implements TokenStore {
  private db: Database.Database;
  private encryptionKey: string;

  constructor(dbPathOrDb: string | Database.Database, encryptionKey: string) {
    this.db =
      typeof dbPathOrDb === 'string' ? new Database(dbPathOrDb) : dbPathOrDb;
    this.encryptionKey = encryptionKey;
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        install_id     TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  get(installId: string): StoredTokens | null {
    const row = this.db
      .prepare('SELECT encrypted_data FROM tokens WHERE install_id = ?')
      .get(installId) as { encrypted_data: string } | undefined;

    if (!row) return null;

    try {
      const json = decrypt(row.encrypted_data, this.encryptionKey);
      return JSON.parse(json) as StoredTokens;
    } catch {
      console.warn(`[TokenStore] Failed to decrypt tokens for install_id=${installId}`);
      return null;
    }
  }

  upsert(installId: string, tokens: StoredTokens): void {
    const encryptedData = encrypt(JSON.stringify(tokens), this.encryptionKey);
    this.db
      .prepare(
        `INSERT INTO tokens (install_id, encrypted_data, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(install_id) DO UPDATE SET
           encrypted_data = excluded.encrypted_data,
           updated_at = datetime('now')`
      )
      .run(installId, encryptedData);
  }

  delete(installId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM tokens WHERE install_id = ?')
      .run(installId);
    return result.changes > 0;
  }

  hasTokens(installId: string): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM tokens WHERE install_id = ? LIMIT 1')
      .get(installId);
    return row !== undefined;
  }

  close(): void {
    this.db.close();
  }
}
