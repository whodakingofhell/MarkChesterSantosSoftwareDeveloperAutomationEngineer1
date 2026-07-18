# MASTER REFERENCE — AI Tool Instructions

**Purpose:** Give this file to any AI tool (Claude, ChatGPT, Copilot, etc.) at the START of a new project. It contains the complete development system.

---

## HOW TO USE THIS SYSTEM

### For AI Tools
When a user asks you to build or review a project, read these files in order:
1. **This file** (MASTER_REFERENCE.md) — understand the system
2. **PROJECT_STARTER.md** — project setup template + quality gates
3. **SECURITY_ARCHITECTURE.md** — security patterns + code templates
4. **EXPERT_CRITIQUES.md** — 15-expert audit framework + checklist

### For Developers
Copy the `SYSTEM/` folder into any new project. It's self-contained.

---

## SYSTEM INVENTORY

| File | Purpose | When to Use |
|------|---------|-------------|
| `MASTER_REFERENCE.md` | Entry point + AI instructions | Start of every project |
| `PROJECT_STARTER.md` | Project template + build sequence | Kickoff |
| `SECURITY_ARCHITECTURE.md` | Security patterns + code | Implementation |
| `EXPERT_CRITIQUES.md` | 15-expert audit + checklist | Pre-deployment |

---

## CORE PRINCIPLES

### 1. Error Resolution Protocol (MANDATORY)
```
1. List ALL errors (A, B, C, D...)
2. Assign severity: CRITICAL > HIGH > MEDIUM > LOW
3. Sort by severity, then blast radius
4. Fix ONE error completely → verify build → next error
5. NEVER skip. NEVER batch. ONE at a time.
```

### 2. Defense-in-Depth Security
Never rely on one security measure. Stack layers:
```
Transport (HTTPS/HSTS)
  → Browser (CSP, CORS, headers)
    → Edge (middleware checks)
      → Server (validation, rate limit, auth)
        → Output (sanitization, escaping)
```

### 3. Fail-Secure Defaults
- If auth is unconfigured → REJECT (not accept)
- If CAPTCHA is unconfigured → ACCEPT (for dev, configurable)
- If signature can't be verified → REJECT
- When in doubt, deny. Log the denial.

### 4. Serverless-Aware Design
- No `setInterval` for cleanup (use request-time cleanup)
- No `Buffer` in Edge Runtime (use `btoa`)
- In-memory state resets on cold start
- Static assets excluded from middleware

### 5. Dual Validation
- Client-side: Show friendly errors (Zod + react-hook-form)
- Server-side: Enforce strict rules (Zod only)
- Never trust client validation alone

---

## REUSABLE CODE PATTERNS

### Pattern 1: Edge Runtime Middleware (Next.js)
```typescript
// src/middleware.ts — Copy and adapt for any Next.js project
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const response = NextResponse.next();

  // 14 security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Request-Id", crypto.randomUUID());

  // CSP with nonce
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // API route protection
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Access-Control-Allow-Origin", `https://${(request.headers.get("host") || "").replace(/:\d+$/, "")}`);
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 1024 * 64) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const userAgent = request.headers.get("user-agent");
    if (!userAgent || userAgent.length < 5) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Pattern 2: API Rate Limiting (Serverless)
```typescript
// lib/rate-limit.ts — In-memory, request-time cleanup
const map = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests = 5, windowMs = 60_000) {
  const now = Date.now();
  const record = map.get(key);

  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfterMs: 0 };
}
```

### Pattern 3: HTML Escaping (Email/Sanitization)
```typescript
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
```

### Pattern 4: HMAC Signing (Web Crypto + Node.js)
```typescript
// Client-side (Web Crypto API)
async function signPayload(payload: string, timestamp: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}:${payload}`);
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Server-side (Node.js crypto)
import { createHmac, timingSafeEqual } from "crypto";
function verifySignature(payload: string, timestamp: number, signature: string, secret: string): boolean {
  if (!secret) return false; // fail-secure
  const expected = createHmac("sha256", secret).update(`${timestamp}:${payload}`).digest("hex");
  if (!expected || !signature) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

### Pattern 5: React Hydration-Safe Client Data
```tsx
// WRONG — causes hydration mismatch (different server/client values)
const [id] = useState(() => generateRandomId());
useMemo(() => { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone); }, []);

// CORRECT — generate in useEffect (client-only), suppressHydrationWarning on display
const [id, setId] = useState("");
const [tz, setTz] = useState("");
useEffect(() => {
  setId(generateRandomId());
  setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
}, []);

// In JSX:
<span suppressHydrationWarning>{id}</span>
<input suppressHydrationWarning min={minDate} />
```

---

## LICENSEDESK PROJECT CONTEXT

If working on the LicenseDesk project specifically:

- **What it is:** Booking form for Windows/Office activation (genuine licenses, Philippines)
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Vercel
- **Payment:** GCash (QR) + PayPal, ₱500/service
- **Notifications:** Discord webhook (primary), Resend email (secondary)
- **Security:** 10-layer defense-in-depth (see SECURITY_ARCHITECTURE.md)
- **Deployed at:** https://deploy-v2-tau-taupe.vercel.app/

### Environment Variables
```
Required:
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
  TURNSTILE_SECRET_KEY=...
  NEXT_PUBLIC_HMAC_SECRET=...
  SUBMISSION_HMAC_SECRET=...       (same as above)

Optional:
  DISCORD_WEBHOOK_URL=...
  RESEND_API_KEY=...
  TO_EMAIL=...
  NEXT_PUBLIC_SENTRY_DSN=...
```

### Git Commands
```powershell
# Commit and push (Windows)
& "C:\Program Files\Git\cmd\git.exe" add -A
& "C:\Program Files\Git\cmd\git.exe" commit -m "message"
& "C:\Program Files\Git\cmd\git.exe" push origin main

# Build locally
npm run build
```

---

## AUDIT HISTORY

All 20 errors found and fixed during LicenseDesk development:

| # | Error | Severity | Status |
|---|-------|----------|--------|
| A | No rate limiting on /api/submit | CRITICAL | FIXED |
| B | Discord failure returns success | CRITICAL | FIXED |
| C | No input sanitization for Discord | CRITICAL | FIXED |
| D | No security headers/CSRF | CRITICAL | FIXED |
| E | ignoreBuildErrors: true, strictMode: false | HIGH | FIXED |
| F | sonner.tsx imports missing next-themes | HIGH | FIXED |
| G | No privacy policy or terms | HIGH | FIXED |
| H | No health check endpoint | MEDIUM | FIXED |
| I | No SEO/OpenGraph metadata | MEDIUM | FIXED |
| J | No footer links to legal pages | LOW | FIXED |
| K | PostCSS XSS vulnerability | HIGH | FIXED |
| L | Buffer.from() crashes Edge Runtime | CRITICAL | FIXED |
| M | CSP nonce leaked via X-Nonce header | HIGH | FIXED |
| N | Vercel CDN adds CORS * by default | HIGH | FIXED |
| O | Email HTML injection | HIGH | FIXED |
| P | Health check exposes env status | MEDIUM | FIXED |
| Q | HMAC verifySignature fail-open | HIGH | FIXED |
| R | setInterval dead in serverless | LOW | FIXED |
| S | turnstileToken no max length | LOW | FIXED |
| T | React hydration mismatch #418 | HIGH | FIXED |

**Result: 20/20 errors found and fixed. 0 remaining.**
