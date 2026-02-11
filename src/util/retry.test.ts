import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryableError, calculateBackoff, sleep } from './retry.js';

describe('isRetryableError', () => {
  it('retries 429', () => {
    expect(isRetryableError(429)).toBe(true);
  });

  it('retries 500', () => {
    expect(isRetryableError(500)).toBe(true);
  });

  it('retries 503', () => {
    expect(isRetryableError(503)).toBe(true);
  });

  it('does not retry 400', () => {
    expect(isRetryableError(400)).toBe(false);
  });

  it('does not retry 401', () => {
    expect(isRetryableError(401)).toBe(false);
  });

  it('does not retry 404', () => {
    expect(isRetryableError(404)).toBe(false);
  });
});

describe('calculateBackoff', () => {
  it('increases delay with attempt number', () => {
    const opts = { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 10000, jitterFactor: 0 };
    expect(calculateBackoff(0, opts)).toBe(100);
    expect(calculateBackoff(1, opts)).toBe(200);
    expect(calculateBackoff(2, opts)).toBe(400);
  });

  it('caps at maxDelayMs', () => {
    const opts = { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 2000, jitterFactor: 0 };
    expect(calculateBackoff(5, opts)).toBe(2000);
  });
});

describe('sleep', () => {
  it('resolves after delay', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});

describe('withRetry', () => {
  it('returns on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries on retryable error', async () => {
    const error = new Error('Server error') as Error & { statusCode: number };
    error.statusCode = 500;
    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-retryable error', async () => {
    const error = new Error('Bad request') as Error & { statusCode: number };
    error.statusCode = 400;
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 })).rejects.toThrow(
      'Bad request'
    );
    expect(fn).toHaveBeenCalledOnce();
  });
});
