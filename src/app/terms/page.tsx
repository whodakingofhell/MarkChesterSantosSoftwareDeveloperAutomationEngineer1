import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — LicenseDesk",
  description: "Terms and conditions for using LicenseDesk activation services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="border-b border-[#DEE2E6] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-sm font-semibold text-[#1B2A4A] no-underline">&larr; Back to Home</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-6">Terms of Service</h1>
        <p className="text-sm text-[#868E96] mb-4">Last updated: July 18, 2026</p>

        <div className="space-y-6 text-sm text-[#495057] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">1. Service Description</h2>
            <p>LicenseDesk provides remote activation services for genuine Microsoft Windows and Microsoft Office products. All activations are performed live via AnyDesk remote desktop software, allowing you to observe the entire process on your screen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">2. Pricing &amp; Payment</h2>
            <p>Service fees are as listed on the booking page. Payment is required before service delivery. Accepted payment methods: GCash and PayPal. You must provide a valid transaction reference number upon booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">3. Refund Policy</h2>
            <p>If the activation does not work as promised, you are entitled to a full refund. Refund requests must be made within 7 days of the service date. To request a refund, contact us with your receipt number and a description of the issue.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">4. Appointment Scheduling</h2>
            <p>Appointments are scheduled in Philippine Time (Asia/Manila, UTC+8). Sessions typically last 5-20 minutes. You must be available at the scheduled time. If you need to reschedule, contact us at least 2 hours before your appointment.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">5. No-Show Policy</h2>
            <p>If you are not available within 10 minutes of your scheduled appointment time, the session may be rescheduled or canceled. Repeated no-shows may result in future booking restrictions.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">6. Limitation of Liability</h2>
            <p>Our services are limited to software activation. We are not responsible for hardware issues, data loss, or third-party software conflicts. Our liability is limited to the amount paid for the specific service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">7. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of our services constitutes acceptance of the updated terms.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
