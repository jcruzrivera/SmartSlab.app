"use client";

import { useEffect } from "react";

import { useToastStore, type Toast } from "@/lib/notifications/toast-store";

const variantStyles: Record<Toast["variant"], { bar: string; icon: string }> = {
  success: { bar: "bg-emerald-500", icon: "text-emerald-500" },
  error: { bar: "bg-red-500", icon: "text-red-500" },
  info: { bar: "bg-[#1bb0ce]", icon: "text-[#1bb0ce]" },
};

function ToastCard({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  const styles = variantStyles[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={`w-1.5 flex-shrink-0 ${styles.bar}`} />
      <div className="flex flex-1 items-start gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => dismissToast(toast.id)}
          className="flex-shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
