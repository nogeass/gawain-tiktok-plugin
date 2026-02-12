/**
 * Gawain TikTok Connector — Entry point.
 * Loads config, initializes SQLite, starts HTTP listener.
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.js';
import { SqliteTokenStore } from './lib/tokenStore.js';
import { createApp } from './app.js';

const config = loadConfig();

// Ensure SQLite directory exists
const dbDir = path.dirname(config.sqlitePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const tokenStore = new SqliteTokenStore(config.sqlitePath, config.tokenEncryptionKey);
const app = createApp(config, tokenStore);

const server = app.listen(config.port, () => {
  console.log(`[connector] Listening on port ${config.port}`);
  console.log(`[connector] Callback URL: ${config.callbackUrl}`);
  console.log(`[connector] Frontend URL: ${config.frontendUrl}`);
});

// Graceful shutdown
function shutdown() {
  console.log('[connector] Shutting down...');
  server.close(() => {
    tokenStore.close();
    console.log('[connector] Stopped.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
