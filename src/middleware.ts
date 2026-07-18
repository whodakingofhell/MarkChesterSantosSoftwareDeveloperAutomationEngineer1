import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_BODY_BYTES = 1024 * 64;

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Request-Id", crypto.randomUUID());

  const turnstileDomains = "challenges.cloudflare.com";
  const googleFonts = "fonts.googleapis.com fonts.gstatic.com";
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://${turnstileDomains}`,
    `style-src 'self' 'unsafe-inline' https://${googleFonts}`,
    `img-src 'self' data: blob:`,
    `font-src 'self' https://${googleFonts}`,
    `connect-src 'self' https://${turnstileDomains}`,
    `frame-src https://${turnstileDomains}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Nonce", nonce);

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const isSameOrigin = origin && host && origin.includes(host);

    if (request.method === "POST" && !isSameOrigin && origin) {
      console.warn(`[Security] Cross-origin POST blocked: origin=${origin}, host=${host}`);
      return NextResponse.json(
        { error: "Cross-origin request denied" },
        { status: 403 }
      );
    }

    const userAgent = request.headers.get("user-agent");
    if (!userAgent || userAgent.length < 5) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|gcash-qr.png|robots.txt|sitemap.xml).*)"],
};
