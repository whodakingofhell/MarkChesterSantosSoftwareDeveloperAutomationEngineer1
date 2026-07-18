import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "noreply@licensedesk.ph";
const TO = process.env.TO_EMAIL || "";

export async function sendBookingConfirmation(data: {
  fullName: string;
  email: string;
  receiptNumber: string;
  services: string[];
  total: number;
  paymentMethod: string;
  scheduleDate: string;
  scheduleTime: string;
  scheduleTimePH?: string;
  transactionNumber: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend || !TO) {
    console.warn("[Email] Resend not configured — skipping confirmation email");
    return { ok: false, error: "Email not configured" };
  }

  const serviceList = data.services.map((s) => `<li>${s}</li>`).join("");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1B2A4A;">
      <div style="background: #FF6B35; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Booking Confirmed</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 13px;">LicenseDesk - Genuine Software Activation</p>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #DEE2E6; border-top: none;">
        <p>Hello <strong>${data.fullName}</strong>,</p>
        <p>Your booking has been received and confirmed. Here are your details:</p>

        <div style="background: #F8F9FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Receipt:</strong> <span style="font-family: monospace; color: #FF6B35;">${data.receiptNumber}</span></p>
          <p style="margin: 0 0 8px;"><strong>Services:</strong></p>
          <ul style="margin: 0 0 8px; padding-left: 20px;">${serviceList}</ul>
          <p style="margin: 0 0 8px;"><strong>Total Paid:</strong> <span style="color: #FF6B35; font-weight: bold;">\u20B1${data.total}</span></p>
          <p style="margin: 0 0 8px;"><strong>Payment:</strong> ${data.paymentMethod} (Ref: ${data.transactionNumber})</p>
          <p style="margin: 0 0 8px;"><strong>Schedule:</strong> ${data.scheduleDate} at ${data.scheduleTime}${data.scheduleTimePH ? ` (PH: ${data.scheduleTimePH})` : ""}</p>
        </div>

        <p style="font-size: 14px;">A specialist will connect with you at your scheduled time via <strong>AnyDesk</strong>. You can watch the entire activation process live on your screen.</p>

        <div style="background: #F0FFF4; border: 1px solid #D3F9D8; border-radius: 8px; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #2B9348;"><strong>Refund Policy:</strong> If the activation does not work, you get a full refund. No risk.</p>
        </div>

        <p style="font-size: 12px; color: #868E96; margin-top: 20px;">Save your receipt number: <strong style="font-family: monospace;">${data.receiptNumber}</strong></p>
      </div>
      <div style="text-align: center; padding: 16px; font-size: 11px; color: #ADB5BD;">
        &copy; ${new Date().getFullYear()} LicenseDesk. All rights reserved.
      </div>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `Booking Confirmed - ${data.receiptNumber} | LicenseDesk`,
      html,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return { ok: false, error: String(error) };
    }

    console.log(`[Email] Confirmation sent to ${data.email} for ${data.receiptNumber}`);
    return { ok: true };
  } catch (err) {
    console.error("[Email] Send error:", err instanceof Error ? err.message : "unknown");
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
