"use client";

import { useState } from "react";

import { ImportDialog } from "@/components/studio/import-dialog";
import { useStudioStore } from "@/components/studio/studio-store";
import type { CutoutKey, TemplateKey } from "@/lib/studio/templates";

const TEMPLATE_BUTTONS: Array<{ key: TemplateKey; label: string }> = [
  { key: "rect", label: "+ Countertop" },
  { key: "lshape", label: "+ L-shape" },
  { key: "island", label: "+ Island" },
];

const CUTOUT_BUTTONS: Array<{ key: CutoutKey; label: string }> = [
  { key: "sink", label: 'Sink 33×22"' },
  { key: "cooktop", label: 'Cooktop 30×21"' },
  { key: "custom", label: "Custom cutout" },
];

function ToolButton({
  onClick,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand-strong disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
    >
      {children}
    </button>
  );
}

export function StudioToolbar() {
  const selection = useStudioStore((s) => s.selection);
  const pastLength = useStudioStore((s) => s.past.length);
  const futureLength = useStudioStore((s) => s.future.length);
  const addTemplate = useStudioStore((s) => s.addTemplate);
  const addCutout = useStudioStore((s) => s.addCutout);
  const rotateSelected = useStudioStore((s) => s.rotateSelected);
  const duplicateSelected = useStudioStore((s) => s.duplicateSelected);
  const deleteSelected = useStudioStore((s) => s.deleteSelected);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);

  const [importOpen, setImportOpen] = useState(false);

  const hasSelection = selection !== null;
  const cutoutSelected = selection?.cutoutIndex !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {TEMPLATE_BUTTONS.map(({ key, label }) => (
        <ToolButton key={key} onClick={() => addTemplate(key)}>
          {label}
        </ToolButton>
      ))}

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      {CUTOUT_BUTTONS.map(({ key, label }) => (
        <ToolButton
          key={key}
          disabled={!hasSelection}
          title={hasSelection ? undefined : "Select a piece first"}
          onClick={() => {
            if (selection) addCutout(selection.pieceId, key);
          }}
        >
          {label}
        </ToolButton>
      ))}

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      <ToolButton
        disabled={!hasSelection || cutoutSelected}
        onClick={rotateSelected}
        title="Rotate 90° (R)"
      >
        ⟳ Rotate
      </ToolButton>
      <ToolButton
        disabled={!hasSelection || cutoutSelected}
        onClick={duplicateSelected}
        title="Duplicate (Ctrl+D)"
      >
        Duplicate
      </ToolButton>
      <ToolButton
        disabled={!hasSelection}
        onClick={deleteSelected}
        title="Delete (Del)"
      >
        Delete
      </ToolButton>

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      <ToolButton disabled={pastLength === 0} onClick={undo} title="Undo (Ctrl+Z)">
        ↩ Undo
      </ToolButton>
      <ToolButton
        disabled={futureLength === 0}
        onClick={redo}
        title="Redo (Ctrl+Y)"
      >
        ↪ Redo
      </ToolButton>

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      <ToolButton onClick={() => setImportOpen(true)}>
        Import from photo/DXF
      </ToolButton>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
