import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";

const HMAC_SECRET = process.env.SUBMISSION_HMAC_SECRET || "";

export function generateNonce(): string {
  return randomBytes(16).toString("base64");
}

export function generateSubmissionId(): string {
  return randomBytes(20).toString("hex");
}

export function signPayload(payload: string, timestamp: number): string {
  if (!HMAC_SECRET) return "";
  const data = `${timestamp}:${payload}`;
  return createHmac("sha256", HMAC_SECRET).update(data).digest("hex");
}

export function verifySignature(payload: string, timestamp: number, signature: string): boolean {
  if (!HMAC_SECRET) return false;
  const expected = signPayload(payload, timestamp);
  if (!expected || !signature) return false;

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function isTimestampFresh(timestamp: number, maxAgeMs = 300_000): boolean {
  const now = Date.now();
  return now - timestamp <= maxAgeMs && now - timestamp >= -10_000;
}

export function hashForLog(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}
