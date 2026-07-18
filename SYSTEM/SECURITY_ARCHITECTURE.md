# SECURITY ARCHITECTURE — LicenseDesk Production Stack

Reusable patterns from the LicenseDesk enterprise security implementation.

---

## WHY THIS SYSTEM WORKS

### Defense-in-Depth Philosophy
No single security measure is relied upon. Each layer catches what the previous layer missed. An attacker must bypass ALL layers to succeed.

```
Browser → CDN (vercel.json headers)
       → Edge Middleware (CSP nonce, CORS, body limit, UA check)
       → API Route (Turnstile, HMAC, rate limit, dedup, Zod validation)
       → External Services (Discord webhook, Resend email, Sentry errors)
```

### Security Layers (10 total)

| # | Layer | Where | What It Stops |
|---|-------|-------|---------------|
| 1 | HTTPS + HSTS | CDN + Middleware | Man-in-the-middle, downgrade attacks |
| 2 | Content Security Policy | Middleware | XSS, code injection, unauthorized scripts |
| 3 | Turnstile CAPTCHA | Client + API | Bots, automated spam, credential stuffing |
| 4 | HMAC Request Signing | Client + API | Payload tampering, parameter injection |
| 5 | Rate Limiting | API | Brute force, denial of service |
| 6 | Per-Email Rate Limit | API | Targeted abuse, email bombing |
| 7 | Duplicate Guard | API | Accidental double-submits, replay attacks |
| 8 | Timestamp Freshness | API | Replay attacks, session fixation |
| 9 | Input Validation (Zod) | API | Injection attacks, malformed data |
| 10 | Honeypot | Client + API | Basic bots (silent reject, no error signal) |

---

## LAYER-BY-LAYER EXPLANATION

### 1. HTTPS + HSTS (Transport Security)
**File:** `middleware.ts`, `vercel.json`
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- Forces HTTPS for 2 years, includes all subdomains
- `preload` submits to browser HSTS preload lists
- Prevents SSL stripping attacks

**Why it matters:** Without HSTS, even with HTTPS, the first visit can be intercepted.

### 2. Content Security Policy (CSP)
**File:** `middleware.ts`
```
script-src 'self' 'nonce-{random}' 'strict-dynamic' https://challenges.cloudflare.com
```
- **Nonce-based:** Every request gets a unique random nonce. Only scripts with this exact nonce can execute.
- **strict-dynamic:** Trusts scripts loaded by trusted scripts (auto-propagation).
- **No unsafe-inline/unsafe-eval:** Eliminates XSS via inline script injection.
- **frame-ancestors 'none':** Prevents clickjacking (stronger than X-Frame-Options).

**Why nonce-per-request:** A static nonce could be stolen. A per-request nonce expires in one page load.

### 3. Cloudflare Turnstile CAPTCHA
**Files:** `components/turnstile.tsx`, `api/submit/route.ts`
- Invisible CAPTCHA — no user interaction required
- Server-side verification via Cloudflare API
- Fail-open when not configured (doesn't break form during development)
- Token sent in form body, verified before any processing

**Why Turnstile over reCAPTCHA:** Privacy-friendly, no Google tracking, faster verification, no visual challenge.

### 4. HMAC Request Signing
**Files:** `lib/crypto.ts`, `page.tsx`, `api/submit/route.ts`
- Client signs critical fields (email, services, total, receipt) with shared secret
- Server verifies with `timingSafeEqual` (constant-time comparison)
- Prevents payload tampering in transit
- Uses Web Crypto API (client) and Node.js crypto (server)

**Why HMAC over HTTPS alone:** HTTPS protects transport. HMAC protects data integrity even if a proxy modifies the body.

### 5. Rate Limiting (Per-IP)
**File:** `lib/rate-limit.ts`, `api/submit/route.ts`
- 5 requests per minute per IP
- Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- Returns `Retry-After` on 429 responses

### 6. Per-Email Rate Limiting
**File:** `api/submit/route.ts`
- 3 submissions per hour per email address
- Prevents one user from flooding the system
- Independent from IP rate limit (catches VPN/proxy users)

### 7. Duplicate Submission Guard
**File:** `api/submit/route.ts`
- Same email + date + services blocked within 60 seconds
- Prevents accidental double-clicks
- 60-second window is short enough to not block legitimate re-booking

### 8. Timestamp Freshness Check
**File:** `lib/crypto.ts`, `api/submit/route.ts`
- Client sends `clientTimestamp` (ms since epoch)
- Server rejects if older than 5 minutes or in the future (>10s tolerance)
- Prevents replay attacks and cached form submissions

### 9. Input Validation (Zod)
**Files:** `app/page.tsx` (client), `api/submit/route.ts` (server)
- Dual validation: client shows errors, server enforces
- Schema includes: min/max lengths, email format, enum values, number ranges
- `turnstileToken` limited to 4096 bytes max

### 10. Honeypot
**Files:** `app/page.tsx`, `api/submit/route.ts`
- Hidden field in form, CSS-hidden via `position: absolute; left: -9999px`
- Bots fill it; humans don't see it
- Server silently returns `success: true` (no error signal to bot operators)

---

## ADDITIONAL SECURITY MEASURES

### Security Headers (14 total)
| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents framing (clickjacking) |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter (insecure) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), ...` | Disables browser features |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetching |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin reads |
| `Origin-Agent-Cluster` | `?1` | Enables origin-level isolation |
| `X-Download-Options` | `noopen` | Prevents IE file execution |
| `Content-Security-Policy` | nonce-based | See Layer 2 above |
| `X-Request-Id` | UUID | Request tracing |

### CORS Policy
- API routes: `Access-Control-Allow-Origin` locked to same origin
- No wildcard `*` allowed
- Only POST + OPTIONS methods allowed on API

### Body Size Limit
- 64KB maximum request body (middleware check)
- Prevents memory exhaustion attacks

### User-Agent Check
- All API requests must have a User-Agent header (min 5 chars)
- Blocks headless bots and curl scripts

### Discord Input Sanitization
**File:** `lib/sanitize.ts`
- `@` prefixed with zero-width space (prevents Discord mentions)
- Backticks prefixed (prevents code block injection)
- Triple newlines collapsed
- All fields truncated to safe lengths

### Email HTML Escaping
**File:** `lib/email.ts`
- All user data HTML-escaped before interpolation
- Prevents HTML injection in confirmation emails
- Protects against phishing via email content manipulation

### Health Check Lockdown
**File:** `api/submit/route.ts`
- `GET /api/submit` returns only `{ status: "ok" }`
- No environment variable disclosure
- No uptime or version information leaked

### Sentry Error Tracking
**File:** `lib/sentry.ts`
- Runtime errors captured with context
- Discord delivery failures tracked
- PII hashed before logging (IP → SHA-256 truncated)

---

## EDGE RUNTIME GOTCHAS (Vercel-specific)

### 1. Buffer is NOT available
```typescript
// WRONG — crashes silently in Edge Runtime
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

// CORRECT — btoa is Edge-compatible
const nonce = btoa(crypto.randomUUID());
```

### 2. setInterval is dead code
Serverless functions spin up per request. Timers from previous invocations are gone.
Use request-time cleanup (e.g., `cleanupMaps()` called at start of each request).

### 3. In-memory rate limiting resets on cold start
`Map`-based rate limiters reset when the function instance is recycled.
For stronger protection, use Redis or Vercel KV. In-memory is acceptable for low-traffic sites.

### 4. Middleware matcher matters
Exclude static assets from middleware to avoid:
- Unnecessary nonce generation on cached files
- CSP headers on images/fonts (wastes bytes)
- Performance degradation

```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|gcash-qr.png|robots.txt|sitemap.xml).*)"],
};
```

### 5. React Hydration Mismatches (SSR/SSG)
Server and client render different HTML → React error #418.

**Common causes:**
- `Math.random()` — different values on server vs client
- `new Date()` — timezone differences between server (UTC) and client (local)
- `Intl.DateTimeFormat().resolvedOptions().timeZone` — unavailable on server
- `useState(() => generateRandom())` — runs on both server and client

**Fix:**
```tsx
// Generate client-only values in useEffect, not useState or useMemo
const [id, setId] = useState("");
const [tz, setTz] = useState("");
const [minDate, setMinDate] = useState("");

useEffect(() => {
  setId(generateRandomId());
  setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const d = new Date();
  setMinDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
}, []);

// Add suppressHydrationWarning to elements displaying client-only values
<span suppressHydrationWarning>{id}</span>
<input suppressHydrationWarning min={minDate} />
```

**Never do:**
```tsx
// WRONG: useMemo with side effects
useMemo(() => { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone); }, []);

// WRONG: useState with Math.random()
const [id] = useState(() => Math.random().toString(36));

// WRONG: Inline new Date() in JSX
<input min={`${new Date().getFullYear()}-${new Date().getMonth()+1}`} />
```

### 6. Headers.delete() in Edge Runtime
Some Edge Runtime implementations throw on `Headers.delete()` for non-existent headers.
Avoid `.delete()` calls. Use `.set()` to overwrite instead, or omit the header entirely.

### 7. Vercel Stale Cache After Deploy
Vercel CDN can serve stale cached responses for up to 5 minutes after env var changes.
Env var changes do NOT trigger a redeploy. Always manually redeploy after adding env vars.
Verify by checking response headers for your middleware-specific headers.

---

## LESSONS LEARNED

| # | Lesson | Impact |
|---|--------|--------|
| 1 | Always test middleware in Edge Runtime, not just Node.js | Buffer crash was silent |
| 2 | CSP nonces must NOT be in response headers | Defeats the entire CSP |
| 3 | Vercel CDN adds CORS `*` by default | Override explicitly in middleware |
| 4 | Health check endpoints must not leak env status | Information disclosure |
| 5 | `verifySignature` returning true when unconfigured = open door | Always fail-secure |
| 6 | HTML in emails needs escaping even if "internal" | Email injection vectors |
| 7 | setInterval in serverless = dead code | Use request-time cleanup |
| 8 | Schema validation needs max lengths on ALL strings | DoS via huge tokens |
| 9 | Static builds on Vercel can serve stale cached responses | Force redeploy after env changes |
| 10 | `unsafe-inline` in CSP for styles is acceptable with React | React requires inline styles |

---

## REUSABLE PATTERN: Next.js Enterprise Security Stack

Copy this template into any Next.js project for instant enterprise-grade security:

### Middleware (`src/middleware.ts`)
1. Generate per-request nonce with `btoa(crypto.randomUUID())`
2. Set all 14 security headers
3. Build CSP with nonce + strict-dynamic
4. For `/api/*` routes: check body size, CORS origin, User-Agent
5. Block cross-origin POSTs

### API Route Protection
1. Zod schema with min/max on ALL fields
2. IP-based rate limit (5/min)
3. Email-based rate limit (3/hr)
4. Duplicate guard (60s window)
5. Timestamp freshness (5min)
6. HMAC signature verification
7. Turnstile token verification

### Client-Side
1. Turnstile widget (invisible mode)
2. HMAC signing with `crypto.subtle`
3. Honeypot field
4. Client-side Zod validation

### Environment Variables Needed
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_HMAC_SECRET=...
SUBMISSION_HMAC_SECRET=...       (same value as above)
```

### Optional
```
DISCORD_WEBHOOK_URL=...          (notifications)
RESEND_API_KEY=...               (email confirmations)
TO_EMAIL=...                     (where to send confirmations)
NEXT_PUBLIC_SENTRY_DSN=...       (error tracking)
```
