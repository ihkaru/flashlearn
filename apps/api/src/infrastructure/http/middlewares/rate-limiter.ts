interface TokenBucket {
  tokens: number;
  lastRefillMs: number;
}

export class InMemoryTokenBucketLimiter {
  private readonly buckets = new Map<string, TokenBucket>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number
  ) {}

  consume(key: string, nowMs = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    if (this.buckets.size > 5000) {
      this.prune(nowMs);
    }
    const existing = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefillMs: nowMs,
    };

    const elapsedSec = Math.max(0, (nowMs - existing.lastRefillMs) / 1000);
    const refilled = Math.min(this.capacity, existing.tokens + elapsedSec * this.refillPerSecond);

    if (refilled >= 1) {
      this.buckets.set(key, { tokens: refilled - 1, lastRefillMs: nowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    this.buckets.set(key, { tokens: refilled, lastRefillMs: nowMs });
    const needed = 1 - refilled;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(needed / this.refillPerSecond)),
    };
  }

  private prune(nowMs: number): void {
    const staleThresholdMs = 10 * 60 * 1000;
    for (const [k, b] of this.buckets.entries()) {
      if (nowMs - b.lastRefillMs > staleThresholdMs) {
        this.buckets.delete(k);
      }
    }
  }
}

export function resolveClientIp(headers: Record<string, string | undefined>): string {
  const xff = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return headers['x-real-ip'] || headers['cf-connecting-ip'] || 'local';
}
