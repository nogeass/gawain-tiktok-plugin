/**
 * OAuth routes for TikTok Shop integration.
 *
 * Endpoints:
 *   GET  /connect/tiktok/start       — Initiate OAuth flow
 *   GET  /connect/tiktok/callback    — Handle OAuth callback
 *   POST /connect/tiktok/disconnect  — Delete stored tokens
 *   GET  /connect/tiktok/status      — Check connection status
 */

import { Router } from 'express';
import { buildAuthUrl, exchangeCodeForToken } from 'gawain-tiktok-plugin';
import type { TikTokAuthConfig } from 'gawain-tiktok-plugin';
import { generateState, verifyState } from '../lib/state.js';
import type { TokenStore, StoredTokens } from '../lib/tokenStore.js';
import type { ConnectorConfig } from '../config.js';

const COOKIE_NAME = 'tiktok_oauth_state';

export function oauthRouter(config: ConnectorConfig, tokenStore: TokenStore): Router {
  const router = Router();

  const authConfig: TikTokAuthConfig = {
    appKey: config.tiktokAppKey,
    appSecret: config.tiktokAppSecret,
    redirectUri: config.callbackUrl,
  };

  /**
   * GET /connect/tiktok/start?install_id=xxx
   * Generates signed state, sets httpOnly cookie, redirects to TikTok.
   */
  router.get('/connect/tiktok/start', (req, res) => {
    const installId = req.query['install_id'] as string | undefined;
    if (!installId || typeof installId !== 'string' || installId.trim() === '') {
      res.status(400).json({ error: 'Missing required query parameter: install_id' });
      return;
    }

    const { nonce, cookie } = generateState(installId.trim(), config.stateSecret);

    res.cookie(COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: config.stateTtlMs,
      path: '/',
    });

    const authUrl = buildAuthUrl(authConfig, nonce);
    res.redirect(authUrl);
  });

  /**
   * GET /connect/tiktok/callback?code=xxx&state=xxx
   * Verifies state, exchanges code for tokens, stores encrypted, redirects to frontend.
   */
  router.get('/connect/tiktok/callback', async (req, res, next) => {
    try {
      const code = req.query['code'] as string | undefined;
      const nonce = req.query['state'] as string | undefined;
      const cookie = req.cookies?.[COOKIE_NAME] as string | undefined;

      if (!code || !nonce) {
        res.status(400).json({ error: 'Missing code or state parameter' });
        return;
      }

      if (!cookie) {
        res.status(403).json({ error: 'Missing OAuth state cookie — please start the flow again' });
        return;
      }

      const verified = verifyState(nonce, cookie, config.stateSecret, config.stateTtlMs);
      if (!verified.valid || !verified.installId) {
        res.status(403).json({ error: 'Invalid or expired OAuth state — please start the flow again' });
        return;
      }

      // Exchange authorization code for tokens
      const tokenResponse = await exchangeCodeForToken(authConfig, code);

      const tokens: StoredTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        accessTokenExpiresAt: Date.now() + tokenResponse.access_token_expire_in * 1000,
        openId: tokenResponse.open_id,
        sellerName: tokenResponse.seller_name,
      };

      tokenStore.upsert(verified.installId, tokens);

      // Clear OAuth state cookie
      res.clearCookie(COOKIE_NAME, { path: '/' });

      // Redirect to frontend success page
      const redirectUrl = new URL(config.frontendUrl);
      redirectUrl.searchParams.set('install_id', verified.installId);
      redirectUrl.searchParams.set('connected', 'true');
      res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /connect/tiktok/disconnect
   * Body: { "installId": "xxx" }
   * Deletes stored tokens for the given install.
   */
  router.post('/connect/tiktok/disconnect', (req, res) => {
    const installId = req.body?.installId as string | undefined;
    if (!installId || typeof installId !== 'string') {
      res.status(400).json({ error: 'Missing required field: installId' });
      return;
    }

    const deleted = tokenStore.delete(installId);
    res.json({ ok: true, deleted });
  });

  /**
   * GET /connect/tiktok/status?install_id=xxx
   * Returns connection status without exposing tokens.
   */
  router.get('/connect/tiktok/status', (req, res) => {
    const installId = req.query['install_id'] as string | undefined;
    if (!installId || typeof installId !== 'string') {
      res.status(400).json({ error: 'Missing required query parameter: install_id' });
      return;
    }

    const connected = tokenStore.hasTokens(installId);
    res.json({ connected });
  });

  return router;
}
