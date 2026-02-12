/**
 * Cryptographic utilities for the connector server.
 * - AES-256-GCM encryption/decryption for token storage
 * - HMAC-SHA256 for state signing
 * - Timing-safe comparison for CSRF verification
 */

import crypto from 'node:crypto';

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns "iv:ciphertext:authTag" in hex encoding.
 */
export function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Input format: "iv:ciphertext:authTag" in hex encoding.
 */
export function decrypt(encryptedStr: string, keyHex: string): string {
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) {
    throw new Error('Decryption failed');
  }

  const [ivHex, ciphertextHex, authTagHex] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex!, 'hex');
  const ciphertext = Buffer.from(ciphertextHex!, 'hex');
  const authTag = Buffer.from(authTagHex!, 'hex');

  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Compute HMAC-SHA256 and return as hex string.
 */
export function hmacSha256Hex(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return crypto.timingSafeEqual(bufA, bufB);
}
