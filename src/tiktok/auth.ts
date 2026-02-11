/**
 * TikTok Shop OAuth 2.0 helpers
 */

const TIKTOK_AUTH_URL = 'https://services.tiktokshop.com/open/authorize';
const TIKTOK_TOKEN_URL = 'https://auth.tiktok-shops.com/api/v2/token/get';
const TIKTOK_REFRESH_URL = 'https://auth.tiktok-shops.com/api/v2/token/refresh';

/**
 * TikTok OAuth configuration
 */
export interface TikTokAuthConfig {
  appKey: string;
  appSecret: string;
  /** OAuth redirect URI (must match TikTok app settings) */
  redirectUri?: string;
}

/**
 * Token response from TikTok
 */
export interface TikTokTokenResponse {
  access_token: string;
  access_token_expire_in: number;
  refresh_token: string;
  refresh_token_expire_in: number;
  open_id: string;
  seller_name?: string;
}

/**
 * Build the TikTok Shop OAuth authorization URL.
 *
 * @param config - OAuth app configuration
 * @param state - CSRF protection state value
 * @returns Full authorization URL to redirect the user to
 */
export function buildAuthUrl(config: TikTokAuthConfig, state: string): string {
  const url = new URL(TIKTOK_AUTH_URL);
  url.searchParams.set('app_key', config.appKey);
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Exchange an authorization code for access and refresh tokens.
 */
export async function exchangeCodeForToken(
  config: TikTokAuthConfig,
  authCode: string
): Promise<TikTokTokenResponse> {
  const url = new URL(TIKTOK_TOKEN_URL);
  url.searchParams.set('app_key', config.appKey);
  url.searchParams.set('app_secret', config.appSecret);
  url.searchParams.set('auth_code', authCode);
  url.searchParams.set('grant_type', 'authorized_code');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`TikTok token exchange failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as {
    code: number;
    message: string;
    data: TikTokTokenResponse;
  };

  if (json.code !== 0) {
    throw new Error(`TikTok token exchange error: ${json.code} ${json.message}`);
  }

  return json.data;
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  config: TikTokAuthConfig,
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const url = new URL(TIKTOK_REFRESH_URL);
  url.searchParams.set('app_key', config.appKey);
  url.searchParams.set('app_secret', config.appSecret);
  url.searchParams.set('refresh_token', refreshToken);
  url.searchParams.set('grant_type', 'refresh_token');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`TikTok token refresh failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as {
    code: number;
    message: string;
    data: TikTokTokenResponse;
  };

  if (json.code !== 0) {
    throw new Error(`TikTok token refresh error: ${json.code} ${json.message}`);
  }

  return json.data;
}
