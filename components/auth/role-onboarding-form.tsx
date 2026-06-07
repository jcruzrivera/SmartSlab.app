"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RoleOption = "buyer" | "vendor" | "both";

const roleOptions: Array<{ value: RoleOption; title: string; subtitle: string }> = [
  {
    value: "buyer",
    title: "I want to buy slabs",
    subtitle: "Browse inventory and place orders quickly.",
  },
  {
    value: "vendor",
    title: "I want to sell slabs",
    subtitle: "Publish inventory and receive inquiries and orders.",
  },
  {
    value: "both",
    title: "I want to buy and sell",
    subtitle: "Use one account for purchasing and selling.",
  },
];

export function RoleOnboardingForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleOption>("buyer");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRole() {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/onboarding/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to save role.");
      }

      if (selectedRole === "buyer") {
        router.push("/account");
        return;
      }

      router.push("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save role.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Choose your role to personalize your SmartSlab experience.
      </p>

      <div className="mt-6 grid gap-3">
        {roleOptions.map((option) => {
          const isActive = selectedRole === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-[#1bb0ce] bg-[#1bb0ce]/10"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
              onClick={() => setSelectedRole(option.value)}
            >
              <p className="font-medium">{option.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {option.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={submitRole}
        disabled={isSaving}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#1bb0ce] px-4 text-sm font-medium text-white transition hover:bg-[#0d8fa8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
