import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { initSentry } from "@/lib/sentry";

initSentry();

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LicenseDesk — Genuine Windows & Office Activation",
    template: "%s — LicenseDesk",
  },
  description:
    "Book genuine Windows and Microsoft Office activation service. Certified Microsoft Authorized Reseller in the Philippines. Remote setup via AnyDesk, same-day service.",
  keywords: [
    "Windows activation",
    "Microsoft Office activation",
    "Microsoft 365",
    "certified reseller",
    "IT services Philippines",
    "LicenseDesk",
    "AnyDesk remote support",
    "genuine license",
  ],
  authors: [{ name: "LicenseDesk" }],
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "LicenseDesk",
    title: "LicenseDesk — Genuine Windows & Office Activation",
    description:
      "Book genuine Windows and Microsoft Office activation. Certified Microsoft Authorized Reseller. Remote AnyDesk setup, same-day service.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LicenseDesk — Genuine Windows & Office Activation",
    description:
      "Book genuine Windows and Microsoft Office activation. Certified Microsoft Authorized Reseller.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
