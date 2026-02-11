/**
 * TikTok Shop API product fetcher
 */

import type { TikTokShopProduct } from './types.js';

const TIKTOK_SHOP_API_BASE = 'https://open-api.tiktokglobalshop.com';

/**
 * Options for fetching a single product
 */
export interface FetchTikTokProductOptions {
  /** TikTok Shop app key */
  appKey: string;
  /** TikTok Shop access token (from OAuth) */
  accessToken: string;
  /** Shop cipher */
  shopCipher: string;
  /** Product ID */
  productId: string;
  /** API base URL override (for testing) */
  apiBase?: string;
}

/**
 * Options for listing products
 */
export interface ListTikTokProductsOptions {
  /** TikTok Shop app key */
  appKey: string;
  /** TikTok Shop access token (from OAuth) */
  accessToken: string;
  /** Shop cipher */
  shopCipher: string;
  /** Page size (default 20, max 100) */
  pageSize?: number;
  /** Page token for pagination */
  pageToken?: string;
  /** API base URL override (for testing) */
  apiBase?: string;
}

/**
 * API response wrapper
 */
interface TikTokApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * Product list response data
 */
interface ProductListData {
  products: TikTokShopProduct[];
  next_page_token?: string;
  total_count?: number;
}

/**
 * Fetch a single product from TikTok Shop API.
 */
export async function fetchTikTokProduct(
  opts: FetchTikTokProductOptions
): Promise<TikTokShopProduct> {
  const base = (opts.apiBase || TIKTOK_SHOP_API_BASE).replace(/\/+$/, '');
  const url = `${base}/product/202309/products/${encodeURIComponent(opts.productId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-tts-access-token': opts.accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok Shop API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as TikTokApiResponse<TikTokShopProduct>;

  if (json.code !== 0) {
    throw new Error(`TikTok Shop API error: ${json.code} ${json.message}`);
  }

  return json.data;
}

/**
 * List products from TikTok Shop API.
 */
export async function fetchTikTokProducts(
  opts: ListTikTokProductsOptions
): Promise<{ products: TikTokShopProduct[]; nextPageToken?: string; totalCount?: number }> {
  const base = (opts.apiBase || TIKTOK_SHOP_API_BASE).replace(/\/+$/, '');
  const url = new URL(`${base}/product/202309/products/search`);

  const body: Record<string, unknown> = {
    page_size: opts.pageSize || 20,
  };
  if (opts.pageToken) {
    body.page_token = opts.pageToken;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'x-tts-access-token': opts.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`TikTok Shop API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as TikTokApiResponse<ProductListData>;

  if (json.code !== 0) {
    throw new Error(`TikTok Shop API error: ${json.code} ${json.message}`);
  }

  return {
    products: json.data.products || [],
    nextPageToken: json.data.next_page_token,
    totalCount: json.data.total_count,
  };
}
