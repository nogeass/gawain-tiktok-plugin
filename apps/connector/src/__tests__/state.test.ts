import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateState, verifyState } from '../lib/state.js';

const SECRET = 'test-hmac-secret-for-state';
const TTL_MS = 600_000; // 10 minutes

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateState + verifyState', () => {
  it('round-trips correctly', () => {
    const { nonce, cookie } = generateState('install-abc', SECRET);
    const result = verifyState(nonce, cookie, SECRET, TTL_MS);
    expect(result.valid).toBe(true);
    expect(result.installId).toBe('install-abc');
  });

  it('fails with wrong nonce', () => {
    const { cookie } = generateState('install-abc', SECRET);
    const result = verifyState('wrong-nonce', cookie, SECRET, TTL_MS);
    expect(result.valid).toBe(false);
    expect(result.installId).toBeNull();
  });

  it('fails with wrong secret', () => {
    const { nonce, cookie } = generateState('install-abc', SECRET);
    const result = verifyState(nonce, cookie, 'wrong-secret', TTL_MS);
    expect(result.valid).toBe(false);
  });

  it('fails when expired', () => {
    const { nonce, cookie } = generateState('install-abc', SECRET);
    // Verify with 0ms TTL (already expired)
    const result = verifyState(nonce, cookie, SECRET, 0);
    expect(result.valid).toBe(false);
  });

  it('fails with tampered cookie', () => {
    const { nonce, cookie } = generateState('install-abc', SECRET);
    const tampered = cookie.slice(0, -4) + 'ffff';
    const result = verifyState(nonce, tampered, SECRET, TTL_MS);
    expect(result.valid).toBe(false);
  });

  it('fails with empty inputs', () => {
    expect(verifyState('', 'cookie', SECRET, TTL_MS).valid).toBe(false);
    expect(verifyState('nonce', '', SECRET, TTL_MS).valid).toBe(false);
  });

  it('extracts installId correctly', () => {
    const { nonce, cookie } = generateState('my-unique-id-123', SECRET);
    const result = verifyState(nonce, cookie, SECRET, TTL_MS);
    expect(result.installId).toBe('my-unique-id-123');
  });
});
