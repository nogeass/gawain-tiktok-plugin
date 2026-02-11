import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAuthUrl, exchangeCodeForToken, refreshAccessToken } from './auth.js';
import type { TikTokAuthConfig } from './auth.js';

const config: TikTokAuthConfig = {
  appKey: 'test_app_key',
  appSecret: 'test_app_secret',
};

describe('buildAuthUrl', () => {
  it('builds correct authorization URL', () => {
    const url = buildAuthUrl(config, 'test_state_123');
    expect(url).toContain('services.tiktokshop.com/open/authorize');
    expect(url).toContain('app_key=test_app_key');
    expect(url).toContain('state=test_state_123');
  });
});

describe('exchangeCodeForToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exchanges code successfully', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        access_token: 'test_access_token',
        access_token_expire_in: 3600,
        refresh_token: 'test_refresh_token',
        refresh_token_expire_in: 86400,
        open_id: 'open_123',
        seller_name: 'Test Shop',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await exchangeCodeForToken(config, 'auth_code_123');
    expect(result.access_token).toBe('test_access_token');
    expect(result.refresh_token).toBe('test_refresh_token');
    expect(result.open_id).toBe('open_123');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(exchangeCodeForToken(config, 'bad_code')).rejects.toThrow(
      'TikTok token exchange failed'
    );
  });

  it('throws on API error code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ code: 40001, message: 'Invalid auth code', data: {} }),
    });

    await expect(exchangeCodeForToken(config, 'expired_code')).rejects.toThrow(
      'TikTok token exchange error'
    );
  });
});

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes token successfully', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        access_token: 'new_access_token',
        access_token_expire_in: 3600,
        refresh_token: 'new_refresh_token',
        refresh_token_expire_in: 86400,
        open_id: 'open_123',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await refreshAccessToken(config, 'old_refresh_token');
    expect(result.access_token).toBe('new_access_token');
  });
});
