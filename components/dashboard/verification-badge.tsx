import type { VerificationStatus } from "@/lib/dashboard/insights";

/**
 * Reusable seller verification badge with a progress indicator. Read-only:
 * derives state from the user profile and does not touch the auth flow.
 */
export function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const checks: { label: string; done: boolean }[] = [
    { label: "Verified email", done: status.email },
    { label: "Verified phone", done: status.phone },
    { label: "Connected Stripe", done: status.stripe },
  ];

  const progress = Math.round((status.completed / status.total) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Seller verification</h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            status.verified
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <span aria-hidden>{status.verified ? "✓" : "•"}</span>
          {status.verified ? "Verified Seller" : "Unverified"}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Verification progress</span>
          <span>
            {status.completed}/{status.total}
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#1bb0ce] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                check.done
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              }`}
              aria-hidden
            >
              {check.done ? "✓" : ""}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
