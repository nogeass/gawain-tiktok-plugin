/**
 * Environment configuration utilities
 * Loads and validates environment variables
 */

export interface EnvConfig {
  gawainApiBase: string;
  /** Optional — free preview works without a key; commercial requires one. */
  gawainApiKey: string;
  gawainAppId: string;
  kinosukeUpgradeUrl: string;
  pollIntervalMs: number;
  pollMaxAttempts: number;
  /** TikTok Shop app key */
  tiktokAppKey: string;
  /** TikTok Shop app secret */
  tiktokAppSecret: string;
  /** TikTok Shop access token (for CLI demo, from OAuth flow) */
  tiktokAccessToken: string;
  /** TikTok Shop cipher (default shop for demo) */
  tiktokShopCipher: string;
}

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_MAX_ATTEMPTS = 60;

/**
 * Get required environment variable or throw
 */
function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
function getOptional(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

/**
 * Get optional numeric environment variable with default
 */
function getOptionalNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }
  return parsed;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  return {
    gawainApiBase: getRequired('GAWAIN_API_BASE'),
    gawainApiKey: getOptional('GAWAIN_API_KEY', ''),
    gawainAppId: getOptional('GAWAIN_APP_ID', ''),
    kinosukeUpgradeUrl: getOptional('KINOSUKE_UPGRADE_URL', 'https://kinosuke.example.com/upgrade'),
    pollIntervalMs: getOptionalNumber('GAWAIN_POLL_INTERVAL_MS', DEFAULT_POLL_INTERVAL_MS),
    pollMaxAttempts: getOptionalNumber('GAWAIN_POLL_MAX_ATTEMPTS', DEFAULT_POLL_MAX_ATTEMPTS),
    tiktokAppKey: getOptional('TIKTOK_APP_KEY', ''),
    tiktokAppSecret: getOptional('TIKTOK_APP_SECRET', ''),
    tiktokAccessToken: getOptional('TIKTOK_ACCESS_TOKEN', ''),
    tiktokShopCipher: getOptional('TIKTOK_SHOP_CIPHER', ''),
  };
}

/**
 * Mask sensitive values for logging
 */
export function maskSecret(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars * 2) {
    return '****';
  }
  return value.slice(0, visibleChars) + '****' + value.slice(-visibleChars);
}
