import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { encrypt, decrypt, hmacSha256Hex, timingSafeEqual } from '../lib/crypto.js';

const TEST_KEY = crypto.randomBytes(32).toString('hex');

describe('AES-256-GCM encrypt/decrypt', () => {
  it('round-trips correctly', () => {
    const plaintext = '{"access_token":"abc123","refresh_token":"def456"}';
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for same plaintext (random IV)', () => {
    const plaintext = 'same data';
    const a = encrypt(plaintext, TEST_KEY);
    const b = encrypt(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
  });

  it('fails with wrong key', () => {
    const plaintext = 'secret data';
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = crypto.randomBytes(32).toString('hex');
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it('fails with tampered ciphertext', () => {
    const encrypted = encrypt('data', TEST_KEY);
    const parts = encrypted.split(':');
    // Flip a byte in the ciphertext
    const tampered = parts[1]!.slice(0, -2) + 'ff';
    const bad = `${parts[0]}:${tampered}:${parts[2]}`;
    expect(() => decrypt(bad, TEST_KEY)).toThrow();
  });

  it('fails with tampered auth tag', () => {
    const encrypted = encrypt('data', TEST_KEY);
    const parts = encrypted.split(':');
    const tampered = parts[2]!.slice(0, -2) + 'ff';
    const bad = `${parts[0]}:${parts[1]}:${tampered}`;
    expect(() => decrypt(bad, TEST_KEY)).toThrow();
  });

  it('fails with malformed input', () => {
    expect(() => decrypt('not:valid', TEST_KEY)).toThrow('Decryption failed');
    expect(() => decrypt('', TEST_KEY)).toThrow('Decryption failed');
  });
});

describe('hmacSha256Hex', () => {
  it('produces consistent hex output', () => {
    const a = hmacSha256Hex('hello', 'secret');
    const b = hmacSha256Hex('hello', 'secret');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('different messages produce different HMACs', () => {
    const a = hmacSha256Hex('hello', 'secret');
    const b = hmacSha256Hex('world', 'secret');
    expect(a).not.toBe(b);
  });
});

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for different strings', () => {
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});
