import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { SqliteTokenStore, type StoredTokens } from '../lib/tokenStore.js';

const TEST_KEY = crypto.randomBytes(32).toString('hex');

const sampleTokens: StoredTokens = {
  accessToken: 'acc_test_token_123',
  refreshToken: 'ref_test_token_456',
  accessTokenExpiresAt: Date.now() + 3600_000,
  openId: 'open_id_789',
  sellerName: 'Test Seller',
};

let db: Database.Database;
let store: SqliteTokenStore;

beforeEach(() => {
  db = new Database(':memory:');
  store = new SqliteTokenStore(db, TEST_KEY);
});

afterEach(() => {
  store.close();
});

describe('SqliteTokenStore', () => {
  it('returns null for non-existent install_id', () => {
    expect(store.get('nonexistent')).toBeNull();
  });

  it('upsert + get round-trips tokens correctly', () => {
    store.upsert('install-1', sampleTokens);
    const result = store.get('install-1');
    expect(result).toEqual(sampleTokens);
  });

  it('upsert overwrites existing tokens', () => {
    store.upsert('install-1', sampleTokens);
    const updated: StoredTokens = {
      ...sampleTokens,
      accessToken: 'new_token',
    };
    store.upsert('install-1', updated);
    const result = store.get('install-1');
    expect(result?.accessToken).toBe('new_token');
  });

  it('delete removes tokens', () => {
    store.upsert('install-1', sampleTokens);
    expect(store.delete('install-1')).toBe(true);
    expect(store.get('install-1')).toBeNull();
  });

  it('delete returns false for non-existent', () => {
    expect(store.delete('nonexistent')).toBe(false);
  });

  it('hasTokens returns true when tokens exist', () => {
    store.upsert('install-1', sampleTokens);
    expect(store.hasTokens('install-1')).toBe(true);
  });

  it('hasTokens returns false after delete', () => {
    store.upsert('install-1', sampleTokens);
    store.delete('install-1');
    expect(store.hasTokens('install-1')).toBe(false);
  });

  it('encrypted_data in DB does not contain plaintext tokens', () => {
    store.upsert('install-1', sampleTokens);
    const row = db
      .prepare('SELECT encrypted_data FROM tokens WHERE install_id = ?')
      .get('install-1') as { encrypted_data: string };

    // Raw encrypted data should NOT contain any recognizable token strings
    expect(row.encrypted_data).not.toContain('acc_test_token_123');
    expect(row.encrypted_data).not.toContain('ref_test_token_456');
    expect(row.encrypted_data).not.toContain('open_id_789');
  });

  it('returns null when decryption fails (wrong key)', () => {
    store.upsert('install-1', sampleTokens);
    const wrongKeyStore = new SqliteTokenStore(db, crypto.randomBytes(32).toString('hex'));
    expect(wrongKeyStore.get('install-1')).toBeNull();
  });
});
