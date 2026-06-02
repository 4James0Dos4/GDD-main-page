type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 10;

export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }

  bucket.count += 1;
  return { ok: true };
}

export function getClientIp(request: Request, clientAddress?: string): string {
  if (clientAddress) return clientAddress;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
}
