import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LicenseDesk",
  description: "How LicenseDesk collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="border-b border-[#DEE2E6] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <a href="/" className="text-sm font-semibold text-[#1B2A4A] no-underline">&larr; Back to Home</a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-6">Privacy Policy</h1>
        <p className="text-sm text-[#868E96] mb-4">Last updated: July 18, 2026</p>

        <div className="space-y-6 text-sm text-[#495057] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">1. Information We Collect</h2>
            <p>When you submit a booking request, we collect: your full name, email address, phone number, company name (if provided), service selection, payment reference number, message content, and timezone information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">2. How We Use Your Information</h2>
            <p>We use your information solely to: process your service booking, send you booking confirmations, deliver the requested service via AnyDesk, and communicate about your appointment. We do not sell, rent, or share your personal data with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">3. Data Storage</h2>
            <p>Your booking data is transmitted to our Discord channel for service fulfillment. We do not maintain a separate database of your information. Discord messages are retained according to Discord&apos;s own retention policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">4. Payment Information</h2>
            <p>We do not process or store payment card information. All payments are processed directly through GCash or PayPal. We only record your payment reference number for verification purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">5. Cookies</h2>
            <p>This website uses only essential cookies required for its operation. We do not use tracking or analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">6. Your Rights</h2>
            <p>You may request deletion of your data by contacting us. You may also request a copy of all data we hold about you.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-2">7. Contact</h2>
            <p>For privacy-related inquiries, contact us through the booking form on our homepage or via email at the address provided in your booking confirmation.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
