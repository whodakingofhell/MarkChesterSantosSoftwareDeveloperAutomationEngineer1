"use client";

import { useState } from "react";
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
  Cloud,
  Smartphone,
  Video,
  Lock,
  FolderSync,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";

// ── Schema ──────────────────────────────────────────────────────────
const SERVICES = [
  { value: "Microsoft 365", icon: Monitor, desc: "Email, apps & collaboration" },
  { value: "Azure Services", icon: Cloud, desc: "Cloud infrastructure & VMs" },
  { value: "Windows Deployment", icon: Smartphone, desc: "OS install & endpoint mgmt" },
  { value: "Microsoft Teams", icon: Video, desc: "Meetings, calls & integrations" },
  { value: "Security & Compliance", icon: Lock, desc: "Identity, MFA & DLP policies" },
  { value: "SharePoint & OneDrive", icon: FolderSync, desc: "File sync & intranet setup" },
  { value: "Other / Not Sure", icon: HelpCircle, desc: "We'll figure it out together" },
] as const;

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  service: z.string().min(1, "Please select a service"),
  contactMethod: z.string().min(1, "Please choose a contact method"),
  message: z.string().max(1000).optional().default(""),
});

type FormData = z.infer<typeof formSchema>;

// ── Component ───────────────────────────────────────────────────────
export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      service: "",
      contactMethod: "",
      message: "",
    },
  });

  const selectedService = watch("service");
  const contactMethod = watch("contactMethod");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      toast.success("Submitted! We'll contact you shortly.");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Request timed out. Check your connection and try again."
            : err.message
          : "Network error — please check your connection.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#F8F9FA]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1B2A4A] mb-3">
            Thank You!
          </h1>
          <p className="text-[#868E96] text-lg mb-2">
            Your inquiry has been received.
          </p>
          <p className="text-[#495057] mb-8">
            I&apos;ll review your details and reach out within 24 hours using your
            preferred contact method. The first consultation is always free.
          </p>
          <Button
            variant="outline"
            className="border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white cursor-pointer"
            onClick={() => {
              setSubmitted(false);
              reset();
            }}
          >
            Submit Another Inquiry
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Form Screen ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header className="w-full border-b border-[#E9ECEF] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B2A4A] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1B2A4A] leading-tight">
              Microsoft Setup Services
            </p>
            <p className="text-xs text-[#868E96]">
              Certified Partner &middot; Genuine Licenses
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          {/* Hero text */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded-full bg-[#FF6B35]/10 text-[#FF6B35] mb-4">
              Free Consultation
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1B2A4A] mb-3">
              Get Your Microsoft Setup Right
            </h1>
            <p className="text-[#495057] max-w-lg mx-auto">
              Fill in your details below and I&apos;ll get back to you within 24 hours
              with a free assessment. No obligation, no pressure.
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-0 shadow-lg shadow-[#1B2A4A]/5">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Row: Name + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[#1B2A4A] font-medium">
                      Full Name <span className="text-[#E03131]">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Juan Dela Cruz"
                      {...register("fullName")}
                      className="h-11 bg-[#F8F9FA] border-[#DEE2E6] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                    />
                    <AnimatePresence>
                      {errors.fullName && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-sm text-[#E03131]"
                        >
                          {errors.fullName.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#1B2A4A] font-medium">
                      Phone Number <span className="text-[#E03131]">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+63 917 123 4567"
                      {...register("phone")}
                      className="h-11 bg-[#F8F9FA] border-[#DEE2E6] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                    />
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-sm text-[#E03131]"
                        >
                          {errors.phone.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1B2A4A] font-medium">
                    Email Address <span className="text-[#E03131]">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...register("email")}
                    className="h-11 bg-[#F8F9FA] border-[#DEE2E6] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                  />
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-[#E03131]"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Service Select */}
                <div className="space-y-2">
                  <Label className="text-[#1B2A4A] font-medium">
                    Which service do you need?{" "}
                    <span className="text-[#E03131]">*</span>
                  </Label>
                  <Select
                    value={selectedService}
                    onValueChange={(v) => setValue("service", v, { shouldValidate: true })}
                  >
                    <SelectTrigger className="h-11 bg-[#F8F9FA] border-[#DEE2E6] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20">
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <s.icon className="w-4 h-4 text-[#FF6B35]" />
                            <span className="font-medium">{s.value}</span>
                            <span className="text-[#868E96] text-xs hidden sm:inline">
                              — {s.desc}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AnimatePresence>
                    {errors.service && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-[#E03131]"
                      >
                        {errors.service.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact Method Radio */}
                <div className="space-y-3">
                  <Label className="text-[#1B2A4A] font-medium">
                    How should I contact you?{" "}
                    <span className="text-[#E03131]">*</span>
                  </Label>
                  <RadioGroup
                    value={contactMethod}
                    onValueChange={(v) =>
                      setValue("contactMethod", v, { shouldValidate: true })
                    }
                    className="flex flex-wrap gap-3"
                  >
                    {["Email", "Phone", "WhatsApp / Viber"].map((method) => (
                      <Label
                        key={method}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                          contactMethod === method
                            ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]"
                            : "border-[#DEE2E6] bg-[#F8F9FA] text-[#495057] hover:border-[#868E96]"
                        }`}
                      >
                        <RadioGroupItem value={method} className="sr-only" />
                        {method}
                      </Label>
                    ))}
                  </RadioGroup>
                  <AnimatePresence>
                    {errors.contactMethod && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-[#E03131]"
                      >
                        {errors.contactMethod.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[#1B2A4A] font-medium">
                    Tell me about your needs{" "}
                    <span className="text-[#868E96] font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your current setup, what you're trying to achieve, or any questions you have..."
                    rows={4}
                    {...register("message")}
                    className="bg-[#F8F9FA] border-[#DEE2E6] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20 resize-none"
                  />
                  <p className="text-xs text-[#868E96] text-right">
                    Max 1000 characters
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold bg-[#FF6B35] hover:bg-[#e85d2a] text-white rounded-lg cursor-pointer transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Inquiry
                    </span>
                  )}
                </Button>

                <p className="text-center text-xs text-[#868E96]">
                  By submitting, you agree to be contacted about Microsoft
                  services. Your data stays private — never shared or sold.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#868E96]">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1B2A4A]" />
              Microsoft Authorized Reseller
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1B2A4A]" />
              Genuine Licenses Only
            </span>
            <span className="flex items-center gap-1.5">
              <Send className="w-4 h-4 text-[#1B2A4A]" />
              Response within 24 hours
            </span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E9ECEF] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center text-xs text-[#868E96]">
          &copy; {new Date().getFullYear()} Microsoft Setup Services. All
          rights reserved.
        </div>
      </footer>
    </div>
  );
}