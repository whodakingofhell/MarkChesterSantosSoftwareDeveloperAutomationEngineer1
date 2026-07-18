"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Shield,
  Send,
  CheckCircle2,
  Loader2,
  Monitor,
  FileText,
  Lock,
  CalendarDays,
  CreditCard,
  Clock,
  Building2,
  X,
  Fingerprint,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TurnstileWidget } from "@/components/turnstile";

const APP_NAME = "LicenseDesk";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const HMAC_SECRET = process.env.NEXT_PUBLIC_HMAC_SECRET || "";

const TIME_SLOTS = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM",
];

const TIP_OPTIONS = [
  { value: "0", label: "No tip" },
  { value: "50", label: "\u20B150" },
  { value: "100", label: "\u20B1100" },
  { value: "200", label: "\u20B1200" },
  { value: "custom", label: "Custom" },
];

function generateReceiptNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `LD-${y}${m}${day}-${rand}`;
}

async function signPayload(payload: string, timestamp: number): Promise<string> {
  if (!HMAC_SECRET) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}:${payload}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().max(150),
  phone: z.string().min(5, "Phone number is too short").max(25),
  email: z.string().email("Please enter a valid email address"),
  serviceWindows: z.boolean(),
  serviceOffice: z.boolean(),
  scheduleDate: z.string().min(1, "Please select a date"),
  scheduleTime: z.string().min(1, "Please select a time slot"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  transactionNumber: z
    .string()
    .min(3, "Enter your reference number")
    .max(50)
    .regex(/^[A-Za-z0-9\-_.\s]+$/, "Only letters, numbers, hyphens, dots allowed"),
  tip: z.string(),
  customTipAmount: z.string(),
  message: z.string().max(1000),
  honeypot: z.string().max(0),
  turnstileToken: z.string().min(1, "Please complete the security verification"),
});

type FormData = {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  serviceWindows: boolean;
  serviceOffice: boolean;
  scheduleDate: string;
  scheduleTime: string;
  paymentMethod: string;
  transactionNumber: string;
  tip: string;
  customTipAmount: string;
  message: string;
  honeypot: string;
  turnstileToken: string;
};

const sectionIcon = ({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="h-px flex-1" style={{ backgroundColor: "#DEE2E6" }} />
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "#868E96" }}>
      <Icon size={13} />
      {title}
    </span>
    <div className="h-px flex-1" style={{ backgroundColor: "#DEE2E6" }} />
  </div>
);

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [clientTz, setClientTz] = useState("");
  const [minDate, setMinDate] = useState("");
  const [qrOpen, setQrOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", company: "", phone: "", email: "",
      serviceWindows: false, serviceOffice: false,
      scheduleDate: "", scheduleTime: "", paymentMethod: "",
      transactionNumber: "", tip: "0", customTipAmount: "", message: "", honeypot: "",
      turnstileToken: "",
    },
  });

  const serviceWin = watch("serviceWindows");
  const serviceOff = watch("serviceOffice");
  const tipVal = watch("tip");
  const customTip = watch("customTipAmount");
  const messageVal = watch("message") || "";
  const scheduleDate = watch("scheduleDate");
  const scheduleTime = watch("scheduleTime");

  useEffect(() => {
    setReceiptNumber(generateReceiptNumber());
    try { setClientTz(Intl.DateTimeFormat().resolvedOptions().timeZone); }
    catch { setClientTz("UTC"); }
    const d = new Date();
    setMinDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }, []);

  const subtotal = (serviceWin ? 500 : 0) + (serviceOff ? 500 : 0);
  const tipNum = tipVal === "custom" ? parseInt(customTip) || 0 : parseInt(tipVal) || 0;
  const total = subtotal + tipNum;

  const phTimeDisplay = useMemo(() => {
    if (!scheduleDate || !scheduleTime) return "";
    try {
      const [time, period] = scheduleTime.split(" ");
      const [h, m] = time.split(":").map(Number);
      let hour = h;
      if (period === "PM" && 12 !== hour) hour += 12;
      if (period === "AM" && 12 === hour) hour = 0;
      const d = new Date(`${scheduleDate}T${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
    } catch { return ""; }
  }, [scheduleDate, scheduleTime]);

  const selectTime = useCallback((slot: string) => {
    setValue("scheduleTime", slot, { shouldValidate: true });
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    if (data.honeypot) { setSubmitted(true); return; }
    if (!data.serviceWindows && !data.serviceOffice) {
      toast.error("Please select at least one service.");
      return;
    }
    setLoading(true);

    const phone = data.phone.trim().replace(/[\s\-()]/g, "");
    const fullPhone = phone.startsWith("+") ? data.phone.trim() : `+63 ${phone}`;

    const clientTimestamp = Date.now();

    const payload = {
      fullName: data.fullName,
      company: data.company || undefined,
      phone: fullPhone,
      email: data.email,
      services: [
        data.serviceWindows ? "Windows Activation" : null,
        data.serviceOffice ? "Microsoft Office Activation" : null,
      ].filter(Boolean),
      subtotal,
      tip: tipNum,
      total,
      scheduleDate: data.scheduleDate,
      scheduleTime: data.scheduleTime,
      scheduleTimePH: phTimeDisplay || undefined,
      clientTimezone: clientTz,
      paymentMethod: data.paymentMethod,
      transactionNumber: data.transactionNumber.trim(),
      message: data.message || undefined,
      receiptNumber,
      honeypot: data.honeypot,
      turnstileToken: data.turnstileToken,
      clientTimestamp,
      signature: "",
    };

    try {
      const payloadForSign = JSON.stringify({
        email: data.email,
        services: payload.services,
        total,
        receiptNumber,
      });
      payload.signature = await signPayload(payloadForSign, clientTimestamp);
    } catch {
      payload.signature = "";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error (${res.status})`);
      }
      const json = await res.json();
      if (!json.success) throw new Error("Submission failed");
      setSubmitted(true);
      toast.success("Booking submitted successfully!");
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out. Please try again."
        : err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F9FA", color: "#1B2A4A" }}>
        <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: "#DEE2E6", backgroundColor: "rgba(248,249,250,0.85)" }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2.5">
              <Shield size={28} strokeWidth={2.2} style={{ color: "#FF6B35" }} />
              <div className="leading-tight">
                <span className="font-bold text-base sm:text-lg tracking-tight block">{APP_NAME}</span>
                <span className="text-xs hidden sm:inline" style={{ color: "#868E96" }}>Certified Partner &middot; Genuine Licenses</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 sm:py-14">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto" style={{ backgroundColor: "#e6f9ed" }}>
              <CheckCircle2 size={42} strokeWidth={1.8} style={{ color: "#2b9348" }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight" style={{ color: "#1B2A4A" }}>Booking Confirmed!</h1>
            <p className="text-base max-w-md mb-2" style={{ color: "#868E96" }}>
              A specialist will connect at your scheduled time via AnyDesk. You can watch the entire activation process live on your screen.
            </p>
            <p className="text-sm max-w-md mb-6" style={{ color: "#868E96" }}>
              A confirmation email has been sent to <span className="font-semibold" style={{ color: "#1B2A4A" }}>{watch("email") || "your email"}</span>.
            </p>
            <div className="w-full max-w-sm rounded-xl border p-5 text-left text-sm mb-4" style={{ borderColor: "#DEE2E6", backgroundColor: "#fff" }}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "#DEE2E6" }}>
                <FileText size={16} style={{ color: "#FF6B35" }} />
                <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "#868E96" }}>Receipt</span>
                <span className="ml-auto font-mono text-xs" style={{ color: "#868E96" }} suppressHydrationWarning>{receiptNumber}</span>
              </div>
              {serviceWin && <div className="flex justify-between py-1"><span>Windows Activation</span><span>\u20B1500</span></div>}
              {serviceOff && <div className="flex justify-between py-1"><span>Office Activation</span><span>\u20B1500</span></div>}
              {tipNum > 0 && <div className="flex justify-between py-1"><span>Tip</span><span>\u20B1{tipNum}</span></div>}
              <div className="flex justify-between pt-3 mt-2 border-t font-bold text-base" style={{ borderColor: "#DEE2E6" }}>
                <span>Total Paid</span>
                <span style={{ color: "#FF6B35" }}>\u20B1{total}</span>
              </div>
            </div>
            <p className="text-xs mb-6" style={{ color: "#868E96" }}>
              Save your receipt: <span className="font-mono font-bold" suppressHydrationWarning>{receiptNumber}</span>
            </p>
            <Button onClick={() => { reset(); setSubmitted(false); }} variant="outline" className="rounded-full px-7 py-2.5 text-sm font-semibold cursor-pointer" style={{ borderColor: "#FF6B35", color: "#FF6B35" }}>
              Book Another Service
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F9FA", color: "#1B2A4A" }}>
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: "#DEE2E6", backgroundColor: "rgba(248,249,250,0.85)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <Shield size={28} strokeWidth={2.2} style={{ color: "#FF6B35" }} />
            <div className="leading-tight">
              <span className="font-bold text-base sm:text-lg tracking-tight block">{APP_NAME}</span>
              <span className="text-xs hidden sm:inline" style={{ color: "#868E96" }}>Certified Partner &middot; Genuine Licenses</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "#D3F9D8", backgroundColor: "#EBFBEE", color: "#2B9348" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#2B9348" }} /> Accepting Bookings
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: "#DEE2E6", color: "#868E96", backgroundColor: "#fff" }}>
              <Lock size={13} /> Microsoft Authorized Reseller
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8 sm:py-14">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full" style={{ backgroundColor: "#fff3ed", color: "#FF6B35" }}>
                <Send size={13} /> Book &amp; Pay
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-[2.4rem] font-extrabold leading-tight tracking-tight" style={{ color: "#1B2A4A" }}>Activate Windows &amp; Microsoft Office</h1>
              <p className="mt-2 text-sm sm:text-base max-w-lg mx-auto" style={{ color: "#868E96" }}>Genuine activation via remote AnyDesk setup. Pick your schedule, pay, and we handle the rest.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <Card className="rounded-2xl shadow-lg border" style={{ borderColor: "#DEE2E6", backgroundColor: "#fff" }}>
                <CardContent className="p-5 sm:p-7">
                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                    <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
                      <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
                    </div>

                    {sectionIcon({ title: "Your Information", icon: Building2 })}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="fullName" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Full Name <span style={{ color: "#E03131" }}>*</span></Label>
                        <Input id="fullName" placeholder="John Doe" autoFocus {...register("fullName")} className="h-11 rounded-lg text-sm" style={{ borderColor: errors.fullName ? "#E03131" : "#DEE2E6" }} />
                        {errors.fullName && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.fullName.message}</motion.p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="company" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Company <span className="font-normal text-xs" style={{ color: "#868E96" }}>(optional)</span></Label>
                        <div className="relative">
                          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#868E96" }} />
                          <Input id="company" placeholder="Acme Corp" {...register("company")} className="h-11 rounded-lg text-sm pl-9" style={{ borderColor: "#DEE2E6" }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Phone Number <span style={{ color: "#E03131" }}>*</span></Label>
                      <div className="flex items-stretch gap-0">
                        <div className="flex items-center justify-center h-11 px-4 text-sm font-bold rounded-l-lg border-r-0 shrink-0" style={{ borderColor: "#DEE2E6", backgroundColor: "#F1F3F5", color: "#1B2A4A", borderWidth: "1px 0 1px 1px" }}>{"\uD83C\uDDF5\uD83C\uDDED"} +63</div>
                        <Input id="phone" type="tel" placeholder="917 123 4567" {...register("phone")} className="h-11 rounded-l-none rounded-r-lg text-sm" style={{ borderColor: errors.phone ? "#E03131" : "#DEE2E6" }} />
                      </div>
                      {errors.phone && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.phone.message}</motion.p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Email Address <span style={{ color: "#E03131" }}>*</span></Label>
                      <Input id="email" type="email" placeholder="you@email.com" {...register("email")} className="h-11 rounded-lg text-sm" style={{ borderColor: errors.email ? "#E03131" : "#DEE2E6" }} />
                      {errors.email && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.email.message}</motion.p>}
                    </div>

                    {sectionIcon({ title: "Service & Pricing", icon: Monitor })}
                    {errors.serviceWindows && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs -mt-2" style={{ color: "#E03131" }}>{errors.serviceWindows.message}</motion.p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: serviceWin ? "#FF6B35" : "#DEE2E6", backgroundColor: serviceWin ? "#fff7ed" : "#fff" }}>
                        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-[#FF6B35]" {...register("serviceWindows")} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Windows Activation</span>
                            <span className="text-sm font-bold" style={{ color: "#FF6B35" }}>\u20B1500</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#868E96" }}>Windows 10 / 11</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all" style={{ borderColor: serviceOff ? "#FF6B35" : "#DEE2E6", backgroundColor: serviceOff ? "#fff7ed" : "#fff" }}>
                        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-[#FF6B35]" {...register("serviceOffice")} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Office Activation</span>
                            <span className="text-sm font-bold" style={{ color: "#FF6B35" }}>\u20B1500</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#868E96" }}>Microsoft 365 / Office</p>
                        </div>
                      </label>
                    </div>

                    {subtotal > 0 && (
                      <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "#DEE2E6", backgroundColor: "#F8F9FA" }}>
                        <div className="flex justify-between py-0.5"><span style={{ color: "#868E96" }}>Subtotal</span><span className="font-medium">\u20B1{subtotal}</span></div>
                        {tipNum > 0 && <div className="flex justify-between py-0.5"><span style={{ color: "#868E96" }}>Tip</span><span>\u20B1{tipNum}</span></div>}
                        <div className="flex justify-between pt-2 mt-1 border-t font-bold text-base" style={{ borderColor: "#DEE2E6" }}><span>Total</span><span style={{ color: "#FF6B35" }}>\u20B1{total}</span></div>
                      </div>
                    )}

                    {subtotal > 0 && (
                      <div className="rounded-lg border p-3 flex items-start gap-3" style={{ borderColor: "#D3F9D8", backgroundColor: "#F0FFF4" }}>
                        <Shield size={18} className="shrink-0 mt-0.5" style={{ color: "#2B9348" }} />
                        <div className="text-xs leading-relaxed" style={{ color: "#2B9348" }}>
                          <span className="font-semibold">Your payment is safe.</span> The entire activation happens live on your screen via AnyDesk. If the activation does not work, you get a full refund. No risk.
                        </div>
                      </div>
                    )}

                    {sectionIcon({ title: "Schedule", icon: CalendarDays })}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="scheduleDate" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Preferred Date <span style={{ color: "#E03131" }}>*</span></Label>
                      <Input id="scheduleDate" type="date" min={minDate} suppressHydrationWarning {...register("scheduleDate")} className="h-11 rounded-lg text-sm" style={{ borderColor: errors.scheduleDate ? "#E03131" : "#DEE2E6" }} />
                      {errors.scheduleDate && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.scheduleDate.message}</motion.p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Preferred Time <span style={{ color: "#E03131" }}>*</span></Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const active = scheduleTime === slot;
                          return (
                            <button key={slot} type="button" onClick={() => selectTime(slot)} className="h-10 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer"
                              style={{ borderColor: active ? "#FF6B35" : "#DEE2E6", backgroundColor: active ? "#FF6B35" : "#fff", color: active ? "#fff" : "#1B2A4A" }}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {errors.scheduleTime && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.scheduleTime.message}</motion.p>}
                    </div>

                    <p className="text-xs flex items-start gap-1.5" style={{ color: "#868E96" }}>
                      <Clock size={11} className="mt-0.5 shrink-0" />
                      Your timezone: {clientTz || "UTC"}. All times are converted to Philippine Time (GMT+8).
                      {phTimeDisplay && <span className="block mt-0.5 font-medium" style={{ color: "#1B2A4A" }}>Philippine Time: {phTimeDisplay}</span>}
                    </p>

                    {sectionIcon({ title: "Payment", icon: CreditCard })}
                    {subtotal > 0 && (
                      <div className="rounded-lg border-2 p-3 text-center" style={{ borderColor: "#FF6B35", backgroundColor: "#fff7ed" }}>
                        <span className="text-xs font-medium" style={{ color: "#868E96" }}>Amount to Pay</span>
                        <div className="text-2xl font-bold mt-0.5" style={{ color: "#FF6B35" }}>\u20B1{total}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setQrOpen(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-[#0052B4]" style={{ borderColor: "#DEE2E6", backgroundColor: "#F8F9FA" }}>
                        <div className="w-28 h-28 rounded-lg overflow-hidden border flex items-center justify-center" style={{ borderColor: "#DEE2E6", backgroundColor: "#fff" }}>
                          <img src="/gcash-qr.png" alt="GCash QR Code" width={112} height={112} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "#0052B4" }}>GCash QR</span>
                        <span className="text-[10px]" style={{ color: "#868E96" }}>Tap to enlarge</span>
                      </button>
                      <a href={total > 0 ? `https://paypal.me/str4ngeee/${total}` : "https://paypal.me/str4ngeee"} target="_blank" rel="noopener noreferrer nofollow" className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:border-[#003087] no-underline" style={{ borderColor: "#DEE2E6", backgroundColor: "#F8F9FA" }}>
                        <div className="w-28 h-28 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: "#003087" }}>
                          <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.655 2.39.175 6.378-3.915 7.578h.002l.002.002c.394.126.775.193 1.142.193h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437.192-1.22-.017-2.16-.738-2.998z" /></svg>
                          <span className="text-white text-[10px] font-bold mt-1.5">Pay Now</span>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "#003087" }}>PayPal</span>
                        <span className="text-[10px]" style={{ color: "#868E96" }}>Opens in new tab</span>
                      </a>
                    </div>
                    <p className="text-xs" style={{ color: "#868E96" }}>Pay the exact amount above, then enter your reference number below.</p>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Payment Method <span style={{ color: "#E03131" }}>*</span></Label>
                      <div className="flex gap-3">
                        {["GCash", "PayPal"].map((m) => {
                          const active = watch("paymentMethod") === m;
                          return (
                            <button key={m} type="button" onClick={() => setValue("paymentMethod", m, { shouldValidate: true })} className="flex-1 h-11 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer"
                              style={{ borderColor: active ? "#FF6B35" : "#DEE2E6", backgroundColor: active ? "#FF6B35" : "#fff", color: active ? "#fff" : "#1B2A4A" }}>
                              {m}
                            </button>
                          );
                        })}
                      </div>
                      {errors.paymentMethod && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.paymentMethod.message}</motion.p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="transactionNumber" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Reference Number <span style={{ color: "#E03131" }}>*</span></Label>
                      <Input id="transactionNumber" placeholder="GCA-123456789 or PayPal ref" {...register("transactionNumber")} className="h-11 rounded-lg text-sm" style={{ borderColor: errors.transactionNumber ? "#E03131" : "#DEE2E6" }} />
                      {errors.transactionNumber && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>{errors.transactionNumber.message}</motion.p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Tip <span className="font-normal text-xs" style={{ color: "#868E96" }}>(optional)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {TIP_OPTIONS.map((opt) => {
                          const active = tipVal === opt.value;
                          return (
                            <label key={opt.value} className="cursor-pointer">
                              <input type="radio" className="peer sr-only" checked={active} onChange={() => setValue("tip", opt.value)} />
                              <span className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium border transition-all select-none"
                                style={{ borderColor: active ? "#FF6B35" : "#DEE2E6", backgroundColor: active ? "#FF6B35" : "#fff", color: active ? "#fff" : "#1B2A4A" }}>
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {tipVal === "custom" && (
                        <div className="relative w-32 mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#868E96" }}>\u20B1</span>
                          <Input placeholder="0" {...register("customTipAmount")} className="h-9 rounded-lg text-sm pl-8" style={{ borderColor: "#DEE2E6" }} type="number" min="0" />
                        </div>
                      )}
                    </div>

                    {sectionIcon({ title: "Additional Details", icon: FileText })}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>Message <span className="font-normal text-xs" style={{ color: "#868E96" }}>(optional)</span></Label>
                        <span className="text-xs tabular-nums" style={{ color: messageVal.length > 900 ? "#E03131" : "#868E96" }}>{messageVal.length}/1000</span>
                      </div>
                      <Textarea id="message" placeholder="PC specs (RAM, SSD/HDD), special requests..." rows={3} {...register("message")} className="rounded-lg text-sm resize-y" style={{ borderColor: "#DEE2E6", minHeight: "80px" }} />
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: "#868E96" }}>
                      <Lock size={11} className="inline -mt-px mr-1" />
                      Your information is only used to fulfill your service request and is never shared with third parties.
                    </p>

                    {TURNSTILE_SITE_KEY && (
                      <div className="flex flex-col items-center gap-2">
                        <TurnstileWidget
                          siteKey={TURNSTILE_SITE_KEY}
                          onVerify={(token) => setValue("turnstileToken", token, { shouldValidate: true })}
                          onExpire={() => setValue("turnstileToken", "", { shouldValidate: true })}
                        />
                        {errors.turnstileToken && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs" style={{ color: "#E03131" }}>
                            {errors.turnstileToken.message}
                          </motion.p>
                        )}
                      </div>
                    )}

                    <Button type="submit" disabled={loading || subtotal === 0} className="w-full h-12 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer"
                      style={{ backgroundColor: loading || subtotal === 0 ? "#e5a382" : "#FF6B35", color: "#fff" }}>
                      {loading ? (
                        <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin" />Processing...</span>
                      ) : (
                        <span className="inline-flex items-center gap-2"><Send size={16} />{subtotal > 0 ? `Pay \u20B1${total} & Book Service` : "Select a Service to Continue"}</span>
                      )}
                    </Button>
                    <p className="text-center text-[11px]" style={{ color: "#ADB5BD" }}>Receipt: <span suppressHydrationWarning>{receiptNumber}</span> &middot; Setup takes 5-20 min via AnyDesk remote</p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium" style={{ color: "#868E96" }}>
              <span className="inline-flex items-center gap-1.5"><Shield size={14} style={{ color: "#FF6B35" }} />Microsoft Authorized Reseller</span>
              <span className="inline-flex items-center gap-1.5"><Lock size={14} style={{ color: "#FF6B35" }} />SSL Encrypted</span>
              <span className="inline-flex items-center gap-1.5"><Fingerprint size={14} style={{ color: "#FF6B35" }} />CAPTCHA Protected</span>
              <span className="inline-flex items-center gap-1.5"><Monitor size={14} style={{ color: "#FF6B35" }} />Live AnyDesk Session</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: "#FF6B35" }} />5-20 Min Setup</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto" style={{ borderColor: "#DEE2E6", backgroundColor: "#fff" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs" style={{ color: "#868E96" }}>
          <span>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> {APP_NAME}. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:underline" style={{ color: "#868E96" }}>Privacy Policy</a>
            <a href="/terms" className="hover:underline" style={{ color: "#868E96" }}>Terms of Service</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {qrOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setQrOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: "#1B2A4A" }}>GCash QR Code</h3>
                <button type="button" onClick={() => setQrOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 cursor-pointer" style={{ color: "#868E96" }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex justify-center mb-4 bg-white rounded-xl p-4 border" style={{ borderColor: "#DEE2E6" }}>
                <img src="/gcash-qr.png" alt="GCash QR Code" width={256} height={256} className="w-64 h-64 object-contain" />
              </div>
              {total > 0 && (
                <>
                  <p className="text-center text-sm font-medium" style={{ color: "#1B2A4A" }}>Pay: <span className="font-bold" style={{ color: "#FF6B35" }}>\u20B1{total}</span></p>
                  <p className="text-center text-xs mt-1" style={{ color: "#868E96" }}>Open GCash app &gt; Scan QR &gt; Enter exact amount</p>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
