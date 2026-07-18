import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeDiscordInput, sanitizeForDisplay } from "@/lib/sanitize";

const SERVICES = [
  "Windows Activation",
  "Microsoft Office Activation",
  "Both Windows & Office",
] as const;

const PAYMENT_METHODS = ["GCash", "PayPal"] as const;

const TIPS = ["0", "50", "100", "200", "custom"] as const;

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().max(150).optional().default(""),
  phone: z.string().min(5, "Phone number is too short").max(25),
  email: z.string().email("Please enter a valid email address"),
  services: z.array(z.enum(SERVICES)).min(1, "Please select at least one service"),
  subtotal: z.number().min(0),
  tip: z.number().min(0).max(10000),
  total: z.number().min(1, "Total must be at least 1"),
  scheduleDate: z.string().min(1, "Please select a date"),
  scheduleTime: z.string().min(1, "Please select a time"),
  scheduleTimePH: z.string().optional(),
  clientTimezone: z.string().optional().default("Unknown"),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: "Please select a payment method" }),
  transactionNumber: z.string().min(3, "Enter your reference number").max(50),
  tipAmount: z.enum(TIPS).optional().default("0"),
  customTipAmount: z.number().optional().default(0),
  message: z.string().max(1000).optional().default(""),
  receiptNumber: z.string().min(1),
  honeypot: z.string().optional().default(""),
});

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

async function sendDiscordNotification(data: z.infer<typeof formSchema>): Promise<{ ok: boolean; attempts: number }> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.error("[Discord] DISCORD_WEBHOOK_URL not configured");
    return { ok: false, attempts: 0 };
  }

  const safeName = sanitizeDiscordInput(data.fullName);
  const safeEmail = sanitizeDiscordInput(data.email);
  const safePhone = sanitizeDiscordInput(data.phone);
  const safeMessage = data.message ? sanitizeDiscordInput(data.message).slice(0, 300) : "";
  const safeCompany = data.company ? sanitizeDiscordInput(data.company) : "";

  const embed = {
    title: "\u{1F7E2} New Booking Request",
    color: 0xff6b35,
    fields: [
      { name: "\u{1F464} Name", value: safeName, inline: true },
      { name: "\u{1F4E7} Email", value: safeEmail, inline: true },
      { name: "\u{1F4F1} Phone", value: safePhone, inline: true },
      { name: "\u{1F527} Service(s)", value: data.services.join(", "), inline: true },
      { name: "\u{1F4B3} Payment", value: `${data.paymentMethod} — \u20B1${data.total}`, inline: true },
      { name: "\u{1F4DD} Ref #", value: sanitizeDiscordInput(data.transactionNumber), inline: true },
      { name: "\u{1F4C5} Date", value: data.scheduleDate, inline: true },
      { name: "\u{1F552} Time", value: data.scheduleTime, inline: true },
      { name: "\u{1F310} PH Time", value: data.scheduleTimePH || "N/A", inline: true },
      { name: "\u{1F4CD} Timezone", value: data.clientTimezone, inline: true },
      { name: "\u{1F4CA} Receipt", value: data.receiptNumber, inline: true },
      ...(safeCompany ? [{ name: "\u{1F3E2} Company", value: safeCompany, inline: true }] : []),
    ],
    ...(safeMessage ? { description: `\u{1F4AC} _"${safeMessage}"_` } : {}),
    footer: { text: "LicenseDesk — Booking Intake" },
    timestamp: new Date().toISOString(),
  };

  let lastError: string = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (res.ok) {
        console.log(`[Discord] Delivered on attempt ${attempt}`);
        return { ok: true, attempts: attempt };
      }

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") || "5") * 1000;
        console.warn(`[Discord] Rate limited, waiting ${retryAfter}ms`);
        await new Promise((r) => setTimeout(r, retryAfter));
        continue;
      }

      lastError = `HTTP ${res.status}`;
      console.error(`[Discord] Attempt ${attempt} failed: ${lastError}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      console.error(`[Discord] Attempt ${attempt} error: ${lastError}`);
    }

    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
  }

  console.error(`[Discord] All 3 attempts failed. Last error: ${lastError}`);
  return { ok: false, attempts: 3 };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  if (data.honeypot) {
    console.warn(`[Submit] Bot detected from IP ${ip}`);
    return NextResponse.json({ success: true });
  }

  console.log(`[Submit] New booking: ${sanitizeForDisplay(data.fullName)} | ${data.email} | ${data.paymentMethod} \u20B1${data.total}`);

  const discord = await sendDiscordNotification(data);

  if (!discord.ok) {
    console.error(`[Submit] Discord notification FAILED for ${data.receiptNumber}`);
  }

  return NextResponse.json({
    success: true,
    receiptNumber: data.receiptNumber,
    discordDelivered: discord.ok,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime?.() ?? 0,
  });
}
