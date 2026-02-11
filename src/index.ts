/**
 * gawain-tiktok-plugin
 * SDK / reference implementation for TikTok Shop → Gawain video generation
 */

// --- Conversion (primary API) ---
export { toGawainJobInput, validateTikTokShopProduct } from './tiktok/convert.js';
export {
  fetchTikTokProduct,
  fetchTikTokProducts,
  type FetchTikTokProductOptions,
  type ListTikTokProductsOptions,
} from './tiktok/fetch.js';
export type { TikTokShopProduct, ConvertOptions } from './tiktok/types.js';

// --- TikTok OAuth ---
export {
  buildAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  type TikTokAuthConfig,
  type TikTokTokenResponse,
} from './tiktok/auth.js';

// --- Gawain client ---
export { GawainClient, createConfigFromEnv, type GawainClientConfig } from './gawain/client.js';
export {
  type ProductInput,
  type GawainJobInput,
  type CreateJobRequest,
  type CreateJobResponse,
  type GetJobResponse,
  type JobStatus,
  GawainApiError,
} from './gawain/types.js';

// --- Install ID (convenience for local/demo use) ---
export {
  getOrCreateInstallId,
  generateInstallId,
  readInstallId,
  writeInstallId,
  buildUpgradeUrl,
} from './install/install_id.js';

// --- Utilities ---
export { loadEnvConfig, maskSecret, type EnvConfig } from './util/env.js';
export { withRetry, sleep, isRetryableError, type RetryOptions } from './util/retry.js';
