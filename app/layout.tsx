import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { AppProviders } from "@/components/providers/app-providers";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { ClerkAuthSlotLoader } from "@/components/site/clerk-auth-slot-loader";
import { CanonicalHostGuard } from "@/components/site/canonical-host-guard";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getClerkPublishableKey, getClerkDomain, getClerkScriptUrls, hasValidClerkConfig } from "@/lib/auth/config";
import { CANONICAL_APP_ORIGIN } from "@/lib/app-origin";
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
  metadataBase: new URL(CANONICAL_APP_ORIGIN),
  title: "SmartSlab — Slab & Remnant Marketplace",
  description:
    "Buy and sell natural stone slabs and remnants. Granite, quartz, quartzite, marble and more.",
  applicationName: "SmartSlab",
  appleWebApp: {
    capable: true,
    title: "SmartSlab",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkConfig = hasValidClerkConfig();
  const clerkDomain = getClerkDomain();
  const clerkScriptUrls = getClerkScriptUrls();
  const isSignedIn = hasClerkConfig ? Boolean((await auth()).userId) : false;

  if (!hasClerkConfig) {
    return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col text-slate-900 dark:text-slate-50">
          <CanonicalHostGuard />
          <RegisterServiceWorker />
          <AppProviders>
            <SiteHeader authSlot={<GuestAuthSlot />} />
            {children}
            <SiteFooter />
          </AppProviders>
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
        <CanonicalHostGuard />
        <RegisterServiceWorker />
        <ClerkProvider
          publishableKey={getClerkPublishableKey()}
          {...(clerkDomain ? { domain: clerkDomain } : {})}
          {...(clerkScriptUrls
            ? {
                __internal_clerkJSUrl: clerkScriptUrls.clerkJSUrl,
                __internal_clerkUIUrl: clerkScriptUrls.clerkUIUrl,
              }
            : {})}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/onboarding"
          signUpFallbackRedirectUrl="/onboarding"
        >
          <AppProviders>
            <SiteHeader
              authSlot={<ClerkAuthSlotLoader isSignedIn={isSignedIn} />}
              isSignedIn={isSignedIn}
            />
            {children}
            <SiteFooter />
          </AppProviders>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
