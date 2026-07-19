"use client";

import dynamic from "next/dynamic";

import type { StudioEditorProps } from "@/components/studio/studio-editor";

const StudioEditor = dynamic(
  () =>
    import("@/components/studio/studio-editor").then((mod) => mod.StudioEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-[600px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    ),
  },
);

export function StudioEditorLoader(props: StudioEditorProps) {
  return <StudioEditor {...props} />;
}
