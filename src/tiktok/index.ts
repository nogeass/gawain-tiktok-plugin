/**
 * TikTok Shop platform — barrel export
 */

export { toGawainJobInput, validateTikTokShopProduct } from './convert.js';
export { fetchTikTokProduct, fetchTikTokProducts } from './fetch.js';
export type { FetchTikTokProductOptions, ListTikTokProductsOptions } from './fetch.js';
export { buildAuthUrl, exchangeCodeForToken, refreshAccessToken } from './auth.js';
export type { TikTokAuthConfig, TikTokTokenResponse } from './auth.js';
export type { TikTokShopProduct, ConvertOptions } from './types.js';
