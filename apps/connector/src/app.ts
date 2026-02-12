/**
 * Express app factory.
 * Separated from index.ts so tests can import the app without starting a listener.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConnectorConfig } from './config.js';
import type { TokenStore } from './lib/tokenStore.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { errorHandlerMiddleware } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { pagesRouter } from './routes/pages.js';
import { oauthRouter } from './routes/oauth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(config: ConnectorConfig, tokenStore: TokenStore): express.Express {
  const app = express();

  // Trust proxy for correct IP in rate limiter (behind reverse proxy)
  app.set('trust proxy', 1);

  // Middleware
  app.use(requestIdMiddleware());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimiterMiddleware({ max: config.rateLimitMax, windowMs: config.rateLimitWindowMs }));

  // Routes
  app.use(healthRouter());

  // Policy pages — look for docs relative to connector root
  const docsDir = path.resolve(__dirname, '..', 'docs', 'policies');
  app.use(pagesRouter(docsDir));

  // Also try repo-level docs if connector-level doesn't exist
  const repoDocsDir = path.resolve(__dirname, '..', '..', '..', 'docs', 'policies');
  app.use(pagesRouter(repoDocsDir));

  app.use(oauthRouter(config, tokenStore));

  // Global error handler (must be last)
  app.use(errorHandlerMiddleware());

  return app;
}
