import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type { ConnectorConfig } from '../config.js';
import { createApp } from '../app.js';
import { SqliteTokenStore } from '../lib/tokenStore.js';

const TEST_KEY = crypto.randomBytes(32).toString('hex');

const testConfig: ConnectorConfig = {
  port: 0,
  tiktokAppKey: 'test_app_key',
  tiktokAppSecret: 'test_app_secret',
  tokenEncryptionKey: TEST_KEY,
  stateSecret: 'test-state-secret',
  callbackUrl: 'http://localhost:3456/connect/tiktok/callback',
  frontendUrl: 'http://localhost:3000',
  sqlitePath: ':memory:',
  stateTtlMs: 600_000,
  rateLimitMax: 1000,
  rateLimitWindowMs: 60_000,
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

describe('GET /connect/tiktok/status', () => {
  it('returns connected=false when no tokens', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/status?install_id=nonexistent')
      .expect(200);

    expect(res.body).toEqual({ connected: false });
  });

  it('returns connected=true when tokens exist', async () => {
    store.upsert('install-xyz', {
      accessToken: 'secret_token_value',
      refreshToken: 'secret_refresh_value',
      accessTokenExpiresAt: Date.now() + 3600000,
      openId: 'open_id_secret',
    });

    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/status?install_id=install-xyz')
      .expect(200);

    expect(res.body).toEqual({ connected: true });
  });

  it('NEVER exposes tokens in response', async () => {
    store.upsert('install-safe', {
      accessToken: 'super_secret_access_token',
      refreshToken: 'super_secret_refresh_token',
      accessTokenExpiresAt: Date.now() + 3600000,
      openId: 'open_id_value',
      sellerName: 'Seller Name',
    });

    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/status?install_id=install-safe')
      .expect(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('super_secret_access_token');
    expect(body).not.toContain('super_secret_refresh_token');
    expect(body).not.toContain('open_id_value');
    expect(body).not.toContain('Seller Name');
    expect(body).not.toContain('accessToken');
    expect(body).not.toContain('refreshToken');
  });

  it('returns 400 without install_id', async () => {
    const app = createApp(testConfig, store);
    await request(app)
      .get('/connect/tiktok/status')
      .expect(400);
  });
});

describe('GET /healthz', () => {
  it('returns ok status', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/healthz')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
