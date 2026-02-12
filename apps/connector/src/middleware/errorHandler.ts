/**
 * Global error handler — catches unhandled errors, masks secrets, returns safe JSON.
 */

import type { ErrorRequestHandler } from 'express';
import { maskSecret } from 'gawain-tiktok-plugin';

/** Pattern matching common token/secret formats */
const SECRET_PATTERN = /(?:token|secret|key|password|credential)[^\s'"]*[=:]\s*['"]?([^\s'"]{8,})/gi;

function sanitizeMessage(message: string): string {
  return message.replace(SECRET_PATTERN, (match, value: string) => {
    return match.replace(value, maskSecret(value));
  });
}

export function errorHandlerMiddleware(): ErrorRequestHandler {
  return (err: Error, req, res, _next) => {
    const requestId = req.id || 'unknown';
    const sanitized = sanitizeMessage(err.message || 'Unknown error');
    console.error(`[${requestId}] Error: ${sanitized}`);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        requestId,
      });
    }
  };
}
