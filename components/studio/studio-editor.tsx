"use client";

import { useEffect, useRef } from "react";

import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioToolbar } from "@/components/studio/studio-toolbar";
import {
  useStudioStore,
  type SerializedPieceRow,
} from "@/components/studio/studio-store";
import { consumeSmartfinderSeed } from "@/lib/smartfinder/handoff";

export type StudioEditorProps = {
  projectId: string;
  projectName: string;
  initialPieces: SerializedPieceRow[];
};

function SaveChip() {
  const saveState = useStudioStore((s) => s.saveState);
  const flushSave = useStudioStore((s) => s.flushSave);

  if (saveState === "idle") return null;

  if (saveState === "error") {
    return (
      <button
        type="button"
        onClick={() => void flushSave()}
        className="inline-flex h-8 items-center rounded-full bg-red-100 px-3 text-xs font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
      >
        Save failed — retry
      </button>
    );
  }

  const label =
    saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved" : "Saved";

  return (
    <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {label}
    </span>
  );
}

export function StudioEditor({
  projectId,
  projectName,
  initialPieces,
}: StudioEditorProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const store = useStudioStore.getState();
    store.init(projectId, initialPieces);

    // Wizard handoff: consume seeded pieces into an empty project.
    if (initialPieces.length === 0) {
      const seed = consumeSmartfinderSeed();
      if (seed && seed.length > 0) {
        useStudioStore.getState().importPieces(seed);
      }
    }
  }, [projectId, initialPieces]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const store = useStudioStore.getState();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        store.undo();
      } else if (
        (mod && event.key.toLowerCase() === "y") ||
        (mod && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        store.redo();
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        store.duplicateSelected();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        if (store.selection) {
          event.preventDefault();
          store.deleteSelected();
        }
      } else if (event.key.toLowerCase() === "r") {
        if (store.selection) {
          event.preventDefault();
          store.rotateSelected();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      const { saveState, flushSave } = useStudioStore.getState();
      if (saveState === "dirty" || saveState === "saving") {
        void flushSave();
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Best-effort flush when navigating away in-app.
      void useStudioStore.getState().flushSave();
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{projectName}</h1>
        <SaveChip />
      </div>
      <StudioToolbar />
      <StudioCanvas />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Click a dimension to edit it — fractions like 25 1/4 work. Drag pieces
        to arrange them. R rotates, Ctrl+D duplicates, Delete removes,
        Ctrl+Z/Ctrl+Y undo/redo.
      </p>
    </div>
  );
}
