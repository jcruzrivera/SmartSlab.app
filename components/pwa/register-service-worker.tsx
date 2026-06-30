"use client";

import { useEffect } from "react";

import { CANONICAL_APP_HOST } from "@/lib/app-origin";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const host = window.location.hostname.toLowerCase();
    if (host !== CANONICAL_APP_HOST) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
