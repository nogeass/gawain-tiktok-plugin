/**
 * HMAC-signed OAuth state for CSRF protection.
 *
 * Design:
 * - URL state parameter: random nonce only (no secrets)
 * - httpOnly cookie: full signed payload "installId:timestamp:nonce:hmac"
 * - Callback verifies nonce match + HMAC validity + TTL
 */

import crypto from 'node:crypto';
import { hmacSha256Hex, timingSafeEqual } from './crypto.js';

const NONCE_BYTES = 16;

export interface GeneratedState {
  /** Random nonce to pass as TikTok's state param */
  nonce: string;
  /** Signed cookie value: "installId:timestamp:nonce:hmac" */
  cookie: string;
}

export interface VerifiedState {
  valid: boolean;
  installId: string | null;
}

/**
 * Generate a new OAuth state (nonce + signed cookie).
 */
export function generateState(installId: string, secret: string): GeneratedState {
  const nonce = crypto.randomBytes(NONCE_BYTES).toString('hex');
  const timestamp = Date.now().toString();
  const payload = `${installId}:${timestamp}:${nonce}`;
  const hmac = hmacSha256Hex(payload, secret);
  const cookie = `${payload}:${hmac}`;

  return { nonce, cookie };
}

/**
 * Verify OAuth state from callback.
 *
 * @param nonce - The state parameter returned by TikTok in the callback URL
 * @param cookie - The signed cookie value
 * @param secret - The HMAC signing secret
 * @param ttlMs - Maximum age of the state in milliseconds
 */
export function verifyState(
  nonce: string,
  cookie: string,
  secret: string,
  ttlMs: number
): VerifiedState {
  const fail: VerifiedState = { valid: false, installId: null };

  if (!nonce || !cookie) return fail;

  // Parse cookie: "installId:timestamp:nonce:hmac"
  const lastColon = cookie.lastIndexOf(':');
  if (lastColon === -1) return fail;

  const payload = cookie.substring(0, lastColon);
  const hmac = cookie.substring(lastColon + 1);

  // Verify HMAC
  const expectedHmac = hmacSha256Hex(payload, secret);
  if (!timingSafeEqual(hmac, expectedHmac)) return fail;

  // Parse payload
  const parts = payload.split(':');
  if (parts.length !== 3) return fail;

  const [installId, timestampStr, cookieNonce] = parts;

  // Verify nonce match
  if (cookieNonce !== nonce) return fail;

  // Verify TTL
  const timestamp = parseInt(timestampStr!, 10);
  if (isNaN(timestamp) || Date.now() - timestamp >= ttlMs) return fail;

  return { valid: true, installId: installId! };
}
