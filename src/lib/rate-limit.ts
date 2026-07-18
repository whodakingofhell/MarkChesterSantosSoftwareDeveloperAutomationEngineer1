const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
  limit: number;
  resetMs: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0, remaining: MAX_REQUESTS - 1, limit: MAX_REQUESTS, resetMs: WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterMs = record.resetTime - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000), remaining: 0, limit: MAX_REQUESTS, resetMs: Math.max(retryAfterMs, 0) };
  }

  record.count++;
  return { allowed: true, retryAfterMs: 0, remaining: MAX_REQUESTS - record.count, limit: MAX_REQUESTS, resetMs: record.resetTime - now };
}
