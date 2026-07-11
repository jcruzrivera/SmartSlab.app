"use client";

import { useSyncExternalStore } from "react";

import {
  buyNowLabel,
  startingCheckoutLabel,
} from "@/lib/i18n/buy-now";

function subscribe() {
  return () => {};
}

function getClientLocale(): string {
  return typeof navigator !== "undefined" ? navigator.language : "en";
}

function getServerLocale(): string {
  return "en";
}

/** Browser language for CTA copy; SSR falls back to English. */
export function useBrowserLocale(): string {
  return useSyncExternalStore(subscribe, getClientLocale, getServerLocale);
}

export function useBuyNowLabel(): string {
  return buyNowLabel(useBrowserLocale());
}

export function useStartingCheckoutLabel(): string {
  return startingCheckoutLabel(useBrowserLocale());
}
