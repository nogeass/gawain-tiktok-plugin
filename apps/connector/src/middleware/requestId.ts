/**
 * Request ID middleware — assigns a UUID to every request.
 */

import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const id = crypto.randomUUID();
    req.id = id;
    _res.setHeader('X-Request-Id', id);
    next();
  };
}
