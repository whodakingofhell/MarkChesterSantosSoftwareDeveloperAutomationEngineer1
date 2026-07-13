import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SERVICES = [
  "Microsoft 365", "Azure Services", "Windows Deployment",
  "Microsoft Teams", "Security & Compliance", "SharePoint & OneDrive", "Other / Not Sure",
] as const;
const CONTACT_METHODS = ["Email", "Phone", "WhatsApp / Viber"] as const;

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().min(7, "Please enter a valid phone number").max(20, "Phone number is too long"),
  email: z.string().email("Please enter a valid email address"),
  service: z.enum(SERVICES, { message: "Please select a service" }),
  contactMethod: z.enum(CONTACT_METHODS, { message: "Please select a contact method" }),
  message: z.string().max(1000).optional().default(""),
});

async function sendDiscord(data: z.infer<typeof formSchema>): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) { console.error("[Discord] No DISCORD_WEBHOOK_URL set"); return false; }

  const embed = {
    title: "🟢 New Service Inquiry",
    color: 0xff6b35,
    fields: [
      { name: "👤 Name", value: data.fullName, inline: true },
      { name: "📧 Email", value: data.email, inline: true },
      { name: "📱 Phone", value: data.phone, inline: true },
      { name: "🔧 Service", value: data.service, inline: true },
      { name: "📞 Contact Via", value: data.contactMethod, inline: true },
      { name: "🕐 Time", value: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }), inline: true },
    ],
    ...(data.message ? { description: `💬 _"${data.message.length > 300 ? data.message.slice(0, 300) + "..." : data.message}"_` } : {}),
    footer: { text: "Microsoft Setup Services — Client Intake" },
  };

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });
      if (res.ok) { console.log("[Discord] ✅ Delivered"); return true; }
      if (res.status === 429) {
        const wait = parseInt(res.headers.get("retry-after") || "5") * 1000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      console.error(`[Discord] Attempt ${i + 1}: HTTP ${res.status}`);
    } catch (err) { console.error(`[Discord] Attempt ${i + 1}:`, err); }
    if (i < 2) await new Promise((r) => setTimeout(r, 1500));
  }
  console.error("[Discord] ❌ All 3 attempts failed");
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
    }
    const data = parsed.data;
    console.log("[Submit] New inquiry:", data.fullName, data.email);
    const discordOk = await sendDiscord(data);
    console.log("[Submit] ✅ Done — Discord:", discordOk ? "SENT" : "FAILED");
    return NextResponse.json({ success: true, message: "Thank you! We'll be in touch soon." });
  } catch (err) {
    console.error("[Submit] ❌ Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}