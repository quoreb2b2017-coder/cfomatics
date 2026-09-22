/** Simple in-memory rate limiter (per serverless isolate). */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit = 90, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

export function pruneRateLimitBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
