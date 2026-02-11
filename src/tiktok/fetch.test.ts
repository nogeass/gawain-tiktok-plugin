import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTikTokProduct, fetchTikTokProducts } from './fetch.js';

describe('fetchTikTokProduct', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches a product successfully', async () => {
    const mockProduct = {
      id: '123',
      title: 'Test Product',
      main_images: [{ url_list: ['https://example.com/img.jpg'] }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, message: 'success', data: mockProduct }),
    });

    const result = await fetchTikTokProduct({
      appKey: 'key',
      accessToken: 'token',
      shopCipher: 'cipher',
      productId: '123',
    });

    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Product');
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      fetchTikTokProduct({
        appKey: 'key',
        accessToken: 'token',
        shopCipher: 'cipher',
        productId: 'nonexistent',
      })
    ).rejects.toThrow('TikTok Shop API error: 404');
  });

  it('throws on API error code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ code: 40001, message: 'Product not found', data: null }),
    });

    await expect(
      fetchTikTokProduct({
        appKey: 'key',
        accessToken: 'token',
        shopCipher: 'cipher',
        productId: '999',
      })
    ).rejects.toThrow('TikTok Shop API error: 40001');
  });

  it('uses custom apiBase', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ code: 0, message: 'ok', data: { id: '1', title: 'T' } }),
    });

    await fetchTikTokProduct({
      appKey: 'key',
      accessToken: 'token',
      shopCipher: 'cipher',
      productId: '1',
      apiBase: 'https://custom-api.example.com',
    });

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('custom-api.example.com');
  });
});

describe('fetchTikTokProducts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists products successfully', async () => {
    const mockData = {
      products: [
        { id: '1', title: 'Product 1' },
        { id: '2', title: 'Product 2' },
      ],
      next_page_token: 'token_abc',
      total_count: 10,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 0, message: 'ok', data: mockData }),
    });

    const result = await fetchTikTokProducts({
      appKey: 'key',
      accessToken: 'token',
      shopCipher: 'cipher',
    });

    expect(result.products).toHaveLength(2);
    expect(result.nextPageToken).toBe('token_abc');
    expect(result.totalCount).toBe(10);
  });
});
