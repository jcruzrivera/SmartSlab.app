"use client";

import { useEffect, useRef } from "react";

import type { DimensionEditTarget } from "@/components/studio/studio-canvas";
import { useStudioStore } from "@/components/studio/studio-store";
import { formatInches, parseInches } from "@/lib/studio/fractions";
import { toast } from "@/lib/notifications/toast-store";

export function DimensionInputOverlay({
  target,
  onClose,
}: {
  target: DimensionEditTarget;
  onClose: () => void;
}) {
  const resizePieceEdge = useStudioStore((s) => s.resizePieceEdge);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (target) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [target]);

  if (!target) return null;

  function commit() {
    if (!target || !inputRef.current) return;
    const parsed = parseInches(inputRef.current.value);
    if (parsed === null) {
      toast.error("Enter a size like 36 1/2");
      return;
    }
    const ok = resizePieceEdge(target.pieceId, target.edgeIndex, parsed);
    if (!ok) {
      toast.error("That size would collapse the piece.");
      return;
    }
    onClose();
  }

  return (
    <div
      className="absolute z-10"
      style={{
        left: Math.max(4, target.screenX - 48),
        top: Math.max(4, target.screenY - 16),
      }}
    >
      <input
        // Remount per target so defaultValue resets without controlled state.
        key={`${target.pieceId}:${target.edgeIndex}`}
        ref={inputRef}
        type="text"
        defaultValue={formatInches(target.currentLen)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        className="h-8 w-24 rounded-md border border-brand bg-white px-2 text-sm shadow-md outline-none dark:bg-slate-900"
        aria-label="Edge length in inches"
      />
    </div>
  );
}
