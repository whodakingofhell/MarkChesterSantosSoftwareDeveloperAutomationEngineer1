const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterMs = record.resetTime - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  record.count++;
  return { allowed: true, retryAfterMs: 0 };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}, 60_000);
