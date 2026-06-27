import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { hasValidClerkConfig } from "@/lib/auth/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartSlab — Slab & Remnant Marketplace",
  description:
    "Buy and sell natural stone slabs and remnants. Granite, quartz, quartzite, marble and more.",
};

function ClerkAuthSlot() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="text-sm font-medium text-slate-600 transition hover:text-[#0d8fa8] dark:text-slate-300">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]">
            Get started
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}

function GuestAuthSlot() {
  return (
    <Link
      href="/browse"
      className="inline-flex h-9 items-center rounded-lg bg-[#1bb0ce] px-3.5 text-sm font-medium text-white transition hover:bg-[#0d8fa8]"
    >
      Browse slabs
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkConfig = hasValidClerkConfig();

  if (!hasClerkConfig) {
    return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col text-slate-900 dark:text-slate-50">
          <SiteHeader authSlot={<GuestAuthSlot />} />
          <AppProviders>{children}</AppProviders>
          <SiteFooter />
          <Analytics />
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-slate-900 dark:text-slate-50">
        <ClerkProvider>
          <SiteHeader authSlot={<ClerkAuthSlot />} />
          <AppProviders>{children}</AppProviders>
          <SiteFooter />
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
