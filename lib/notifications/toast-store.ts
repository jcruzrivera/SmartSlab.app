"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastStore = {
  toasts: Toast[];
  addToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const DEFAULT_DURATION = 4000;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (input) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
      duration: input.duration ?? DEFAULT_DURATION,
    };

    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * Imperative helper so non-React code (event handlers, callbacks) can fire a
 * toast without calling the hook: `toast.success("Saved")`.
 */
export const toast = {
  show: (input: ToastInput) => useToastStore.getState().addToast(input),
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: "error" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, variant: "info" }),
};
