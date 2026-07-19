"use client";

import { useRef, useState } from "react";

import { useStudioStore } from "@/components/studio/studio-store";
import type { Piece } from "@/lib/smartfinder/types";
import { toast } from "@/lib/notifications/toast-store";

const ACCEPT = ".pdf,.dxf,image/jpeg,image/png,image/webp,image/gif";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const importPieces = useStudioStore((s) => s.importPieces);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File is too large (12 MB max).");
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/smartfinder/extract-pieces", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        pieces?: Piece[];
        error?: string;
      };
      if (!response.ok || data.error) {
        toast.error(data.error ?? "Could not read pieces from that file.");
        return;
      }
      if (!data.pieces || data.pieces.length === 0) {
        toast.error("No pieces were found in that file.");
        return;
      }
      importPieces(data.pieces);
      onClose();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Import pieces
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Upload a plan photo, PDF, or DXF and we&apos;ll extract the pieces
          into this project.
        </p>
        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-strong dark:text-slate-300"
          />
        </div>
        {busy ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Reading pieces…
          </p>
        ) : null}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm text-slate-600 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
