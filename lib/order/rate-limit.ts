// R18 (design.md): a public endpoint holding the service-role key invites
// abuse (order spam). This in-memory, per-IP token bucket is step 1 of
// app/api/orders/route.ts, run BEFORE any parsing -- a 429 here is cheaper
// than a wasted zod parse + catalog fetch for a client that's already over
// budget.
//
// Deliberately in-memory only: the bucket lives in module state (a plain
// Map), so it only works correctly for a single server instance. A
// multi-instance deploy would reset/duplicate the bucket per instance and
// would need a shared store (e.g. Redis) -- out of scope for v1, consistent
// with the "single small deploy" assumption the rest of this change makes
// (no queue, no background worker, no migration).
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 10;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

// `now` is an explicit parameter (defaulting to Date.now()) rather than a
// hidden global read, specifically so tests can drive the window boundary
// deterministically without vi.useFakeTimers().
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count < MAX_REQUESTS_PER_WINDOW) {
    bucket.count += 1;
    return { allowed: true };
  }

  return { allowed: false, retryAfterMs: WINDOW_MS - (now - bucket.windowStart) };
}

// Test-only escape hatch -- keeps `buckets` itself module-private so nothing
// in app code can reach in and reset it.
export function __resetRateLimitForTests(): void {
  buckets.clear();
}
