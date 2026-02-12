/**
 * Connector server configuration.
 * Loads and validates all required environment variables at startup.
 */

export interface ConnectorConfig {
  port: number;
  tiktokAppKey: string;
  tiktokAppSecret: string;
  tokenEncryptionKey: string;
  stateSecret: string;
  callbackUrl: string;
  frontendUrl: string;
  sqlitePath: string;
  stateTtlMs: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }
  return parsed;
}

export function loadConfig(): ConnectorConfig {
  const key = getRequired('TOKEN_ENCRYPTION_KEY');
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  return {
    port: getOptionalNumber('PORT', 3456),
    tiktokAppKey: getRequired('TIKTOK_APP_KEY'),
    tiktokAppSecret: getRequired('TIKTOK_APP_SECRET'),
    tokenEncryptionKey: key,
    stateSecret: getRequired('STATE_SECRET'),
    callbackUrl: getRequired('CALLBACK_URL'),
    frontendUrl: getRequired('FRONTEND_URL'),
    sqlitePath: process.env['SQLITE_PATH'] || './data/connector.db',
    stateTtlMs: getOptionalNumber('STATE_TTL_MS', 600_000),
    rateLimitMax: getOptionalNumber('RATE_LIMIT_MAX', 60),
    rateLimitWindowMs: getOptionalNumber('RATE_LIMIT_WINDOW_MS', 60_000),
  };
}
