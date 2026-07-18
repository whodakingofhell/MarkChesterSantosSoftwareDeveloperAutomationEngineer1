export function sanitizeDiscordInput(input: string): string {
  return input
    .replace(/@/g, "@\u200B")
    .replace(/`/g, "\u200B`")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 1000);
}

export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateReceiptNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `LD-${y}${m}${day}-${rand}`;
}
