#!/bin/bash
set -e

echo "=== LicenseDesk — Full Project Setup ==="

mkdir -p deploy-v2 && cd deploy-v2

# ── package.json ──
cat > package.json << 'PKGJSON'
{
  "name": "microsoft-setup-form",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slot": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.0.0",
    "lucide-react": "^0.525.0",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.60.0",
    "sonner": "^2.0.0",
    "tailwind-merge": "^3.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.3.5",
    "typescript": "^5"
  }
}
PKGJSON

# ── tsconfig.json ──
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
TSCONFIG

# ── next.config.ts ──
cat > next.config.ts << 'NEXTCFG'
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};
export default nextConfig;
NEXTCFG

# ── postcss.config.mjs ──
cat > postcss.config.mjs << 'POSTCSS'
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
POSTCSS

# ── .env.example ──
cat > .env.example << 'ENVFILE'
DISCORD_WEBHOOK_URL=
ENVFILE

# ── .gitignore ──
cat > .gitignore << 'GITIGNORE'
node_modules
.next
.env*
!.env.example
*.log
.vercel
*.tsbuildinfo
next-env.d.ts
GITIGNORE

# ── Source directories ──
mkdir -p src/app/api/submit src/app/privacy src/app/terms src/components/ui src/lib SYSTEM

# ── src/lib/utils.ts ──
cat > src/lib/utils.ts << 'UTILS'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
UTILS

# ── src/lib/rate-limit.ts ──
cat > src/lib/rate-limit.ts << 'RATELIMIT'
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterMs = record.resetTime - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  record.count++;
  return { allowed: true, retryAfterMs: 0 };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}, 60_000);
RATELIMIT

# ── src/lib/sanitize.ts ──
cat > src/lib/sanitize.ts << 'SANITIZE'
export function sanitizeDiscordInput(input: string): string {
  return input
    .replace(/@/g, "@\u200B")
    .replace(/`/g, "\u200B`")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 1000);
}

export function sanitizeForDisplay(input: string): string {
  return input.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
}
SANITIZE

# ── src/app/globals.css ──
cat > src/app/globals.css << 'GLOBALS'
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans), "Inter", system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), monospace;
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: #F8F9FA;
  --foreground: #1B2A4A;
  --card: #FFFFFF;
  --card-foreground: #1B2A4A;
  --popover: #FFFFFF;
  --popover-foreground: #1B2A4A;
  --primary: #1B2A4A;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F3F5;
  --secondary-foreground: #1B2A4A;
  --muted: #E9ECEF;
  --muted-foreground: #868E96;
  --accent: #FF6B35;
  --accent-foreground: #FFFFFF;
  --destructive: #E03131;
  --border: #DEE2E6;
  --input: #DEE2E6;
  --ring: #FF6B35;
}

:root { color-scheme: light; }

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
GLOBALS

echo "=== Phase 1: Config files done ==="

# ── Install deps ──
npm install

echo "=== Phase 2: Dependencies installed ==="

# ── src/components/ui/button.tsx ──
cat > src/components/ui/button.tsx << 'BTN'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
BTN

# ── src/components/ui/card.tsx ──
cat > src/components/ui/card.tsx << 'CARD'
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)} {...props} />
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

export { Card, CardContent }
CARD

# ── src/components/ui/input.tsx ──
cat > src/components/ui/input.tsx << 'INPUT'
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive", className)} {...props} />
}

export { Input }
INPUT

# ── src/components/ui/label.tsx ──
cat > src/components/ui/label.tsx << 'LABEL'
"use client"
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root data-slot="label" className={cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className)} {...props} />
}

export { Label }
LABEL

# ── src/components/ui/textarea.tsx ──
cat > src/components/ui/textarea.tsx << 'TEXTAREA'
import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} {...props} />
}

export { Textarea }
TEXTAREA

# ── src/components/ui/sonner.tsx ──
cat > src/components/ui/sonner.tsx << 'SONNER'
"use client"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return <Sonner theme="light" className="toaster group" style={{ "--normal-bg": "var(--popover)", "--normal-text": "var(--popover-foreground)", "--normal-border": "var(--border)" } as React.CSSProperties} {...props} />
}

export { Toaster }
SONNER

echo "=== Phase 3: UI components done ==="
