/**
 * In-memory sliding-window rate limiter per IP.
 * Sufficient for app review submission; production would use Redis.
 */

import type { RequestHandler } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimiterMiddleware(opts: {
  max: number;
  windowMs: number;
}): RequestHandler {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  cleanupInterval.unref();

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
      return;
    }

    next();
  };
}
