"use client";

type PlanPreviewProps = {
  imageUrl: string;
  className?: string;
};

/**
 * Large plan/drawing preview so the operator can verify AI-extracted
 * dimensions against the uploaded layout (mobile + desktop).
 */
export function PlanPreview({ imageUrl, className }: PlanPreviewProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Plan preview
        </p>
        <p className="text-xs text-slate-400">Verify against AI readings</p>
      </div>
      <div className="flex max-h-[40vh] items-center justify-center bg-[linear-gradient(45deg,#e2e8f022_25%,transparent_25%),linear-gradient(-45deg,#e2e8f022_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f022_75%),linear-gradient(-45deg,transparent_75%,#e2e8f022_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-2 lg:max-h-none lg:min-h-[320px] dark:bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Uploaded project plan"
          className="max-h-[36vh] w-full object-contain lg:max-h-[min(70vh,640px)]"
        />
      </div>
    </div>
  );
}
