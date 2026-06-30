"use client";

import { useEffect } from "react";

import { CANONICAL_APP_HOST, CANONICAL_APP_ORIGIN } from "@/lib/app-origin";

const WWW_HOST = `www.${CANONICAL_APP_HOST}`;

/**
 * Client-side fallback: send www traffic to the apex host before other scripts
 * run, and drop any service worker registered on the wrong host.
 */
export function CanonicalHostGuard() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const host = window.location.hostname.toLowerCase();
    if (host !== WWW_HOST) {
      return;
    }

    void navigator.serviceWorker?.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });

    const { pathname, search, hash } = window.location;
    window.location.replace(`${CANONICAL_APP_ORIGIN}${pathname}${search}${hash}`);
  }, []);

  return null;
}
