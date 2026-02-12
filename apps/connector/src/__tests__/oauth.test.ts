import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type { ConnectorConfig } from '../config.js';
import { createApp } from '../app.js';
import { SqliteTokenStore } from '../lib/tokenStore.js';
import { generateState } from '../lib/state.js';

const TEST_KEY = crypto.randomBytes(32).toString('hex');
const STATE_SECRET = 'test-state-secret';

const testConfig: ConnectorConfig = {
  port: 0,
  tiktokAppKey: 'test_app_key',
  tiktokAppSecret: 'test_app_secret',
  tokenEncryptionKey: TEST_KEY,
  stateSecret: STATE_SECRET,
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
  vi.restoreAllMocks();
});

describe('GET /connect/tiktok/start', () => {
  it('redirects to TikTok with state param', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/start?install_id=test-123')
      .expect(302);

    expect(res.headers['location']).toContain('services.tiktokshop.com/open/authorize');
    expect(res.headers['location']).toContain('app_key=test_app_key');
    expect(res.headers['location']).toContain('state=');

    // Should set httpOnly cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    expect(cookieStr).toContain('tiktok_oauth_state');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('returns 400 without install_id', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/start')
      .expect(400);

    expect(res.body.error).toContain('install_id');
  });

  it('returns 400 with empty install_id', async () => {
    const app = createApp(testConfig, store);
    await request(app)
      .get('/connect/tiktok/start?install_id=')
      .expect(400);
  });
});

describe('GET /connect/tiktok/callback', () => {
  it('returns 400 without code', async () => {
    const app = createApp(testConfig, store);
    await request(app)
      .get('/connect/tiktok/callback?state=nonce')
      .expect(400);
  });

  it('returns 403 without cookie', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/callback?code=test_code&state=nonce')
      .expect(403);

    expect(res.body.error).toContain('cookie');
  });

  it('returns 403 with invalid state', async () => {
    const app = createApp(testConfig, store);
    const res = await request(app)
      .get('/connect/tiktok/callback?code=test_code&state=bad_nonce')
      .set('Cookie', 'tiktok_oauth_state=bad:data:here:invalid')
      .expect(403);

    expect(res.body.error).toContain('Invalid');
  });

  it('exchanges code and stores tokens on valid state', async () => {
    // Mock the TikTok token exchange API
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          code: 0,
          message: 'success',
          data: {
            access_token: 'mock_access_token',
            access_token_expire_in: 7200,
            refresh_token: 'mock_refresh_token',
            refresh_token_expire_in: 2592000,
            open_id: 'mock_open_id',
            seller_name: 'Mock Seller',
          },
        }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { nonce, cookie } = generateState('install-abc', STATE_SECRET);
    const app = createApp(testConfig, store);

    const res = await request(app)
      .get(`/connect/tiktok/callback?code=auth_code_123&state=${nonce}`)
      .set('Cookie', `tiktok_oauth_state=${cookie}`)
      .expect(302);

    // Should redirect to frontend
    expect(res.headers['location']).toContain('localhost:3000');
    expect(res.headers['location']).toContain('connected=true');
    expect(res.headers['location']).toContain('install_id=install-abc');

    // Tokens should be stored
    expect(store.hasTokens('install-abc')).toBe(true);
    const tokens = store.get('install-abc');
    expect(tokens?.accessToken).toBe('mock_access_token');
    expect(tokens?.openId).toBe('mock_open_id');
  });
});

describe('POST /connect/tiktok/disconnect', () => {
  it('deletes stored tokens', async () => {
    store.upsert('install-del', {
      accessToken: 'a',
      refreshToken: 'b',
      accessTokenExpiresAt: Date.now() + 3600000,
      openId: 'o',
    });

    const app = createApp(testConfig, store);
    const res = await request(app)
      .post('/connect/tiktok/disconnect')
      .send({ installId: 'install-del' })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.deleted).toBe(true);
    expect(store.hasTokens('install-del')).toBe(false);
  });

  it('returns 400 without installId', async () => {
    const app = createApp(testConfig, store);
    await request(app)
      .post('/connect/tiktok/disconnect')
      .send({})
      .expect(400);
  });
});
