"use client";

import { create } from "zustand";

import { savePiecesAction } from "@/app/account/smartfinder/studio/[projectId]/actions";
import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";
import type { SfPieceRow } from "@/lib/db/sfProjects";
import {
  polygonAabb,
  rectPolygon,
  normalizeVertices,
} from "@/lib/smartfinder/geometry";
import type { Piece } from "@/lib/smartfinder/types";
import {
  clampCutoutOffset,
  resizeEdge as resizeEdgeGeometry,
  rotatePieceWithCutouts,
  snapQuarter,
} from "@/lib/studio/piece-geometry";
import {
  CUTOUTS,
  TEMPLATES,
  type CutoutKey,
  type TemplateKey,
} from "@/lib/studio/templates";
import { toast } from "@/lib/notifications/toast-store";

export type StudioPiece = {
  id: string;
  kind: "countertop" | "backsplash" | "island" | "other";
  label: string;
  /** Shape normalized to origin (min x/y = 0), inches. */
  polygon: SfPolygon;
  /** World position of the shape's origin, inches. */
  x: number;
  y: number;
  cutouts: SfCutout[];
  veinLocked: boolean;
  sortOrder: number;
};

export type StudioSelection = {
  pieceId: string;
  cutoutIndex?: number;
} | null;

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const MAX_PIECES = 50;
const MAX_HISTORY = 50;
const AUTOSAVE_DELAY_MS = 2000;
const PLACEMENT_GAP_IN = 12;
const PLACEMENT_WRAP_IN = 300;

type StudioStore = {
  projectId: string | null;
  pieces: StudioPiece[];
  selection: StudioSelection;
  past: StudioPiece[][];
  future: StudioPiece[][];
  saveState: SaveState;
  lastSavedAt: number | null;

  init: (projectId: string, rows: SerializedPieceRow[]) => void;
  select: (selection: StudioSelection) => void;
  addTemplate: (key: TemplateKey) => void;
  addCutout: (pieceId: string, key: CutoutKey) => void;
  movePiece: (id: string, x: number, y: number) => void;
  moveCutout: (pieceId: string, index: number, ox: number, oy: number) => void;
  rotateSelected: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  resizePieceEdge: (pieceId: string, edgeIndex: number, newLen: number) => boolean;
  renamePiece: (id: string, label: string) => void;
  importPieces: (pieces: Piece[]) => void;
  undo: () => void;
  redo: () => void;
  flushSave: () => Promise<void>;
};

/** Serializable subset of SfPieceRow passed from the server page. */
export type SerializedPieceRow = Pick<
  SfPieceRow,
  "id" | "kind" | "label" | "polygon" | "cutouts" | "veinLocked" | "sortOrder"
>;

function clonePieces(pieces: StudioPiece[]): StudioPiece[] {
  return structuredClone(pieces);
}

/** Split a world-coordinate polygon into normalized shape + position (D1). */
function splitWorldPolygon(polygon: SfPolygon): {
  polygon: SfPolygon;
  x: number;
  y: number;
} {
  const aabb = polygonAabb(polygon);
  if (!aabb) return { polygon, x: 0, y: 0 };
  return {
    polygon: polygon.map((v) => ({ x: v.x - aabb.minX, y: v.y - aabb.minY })),
    x: aabb.minX,
    y: aabb.minY,
  };
}

/** Next free spot: right of the current furthest piece, wrapping into rows. */
function nextPlacement(pieces: StudioPiece[]): { x: number; y: number } {
  if (pieces.length === 0) return { x: 0, y: 0 };

  let maxX = 0;
  let rowY = 0;
  let rowMaxH = 0;
  for (const p of pieces) {
    const aabb = polygonAabb(p.polygon);
    if (!aabb) continue;
    if (p.y >= rowY) {
      rowY = p.y;
    }
    maxX = Math.max(maxX, p.x + aabb.widthIn);
    rowMaxH = Math.max(rowMaxH, p.y + aabb.heightIn);
  }

  if (maxX > PLACEMENT_WRAP_IN) {
    return { x: 0, y: snapQuarter(rowMaxH + PLACEMENT_GAP_IN) };
  }
  return { x: snapQuarter(maxX + PLACEMENT_GAP_IN), y: rowY };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveGeneration = 0;

async function runSave(): Promise<void> {
  const { projectId, pieces } = useStudioStore.getState();
  if (!projectId) return;

  const generation = ++saveGeneration;
  useStudioStore.setState({ saveState: "saving" });

  const payload = {
    projectId,
    pieces: pieces.map((p, index) => ({
      id: p.id,
      kind: p.kind,
      label: p.label,
      // Bake world position back into the stored polygon (D1).
      polygon: p.polygon.map((v) => ({
        x: Math.round((v.x + p.x) * 1000) / 1000,
        y: Math.round((v.y + p.y) * 1000) / 1000,
      })),
      cutouts: p.cutouts,
      veinLocked: p.veinLocked,
      sortOrder: index,
    })),
  };

  try {
    const result = await savePiecesAction(payload);
    if (generation !== saveGeneration) return; // stale response
    if (result.ok) {
      useStudioStore.setState({
        saveState: "saved",
        lastSavedAt: result.savedAt ?? Date.now(),
      });
    } else {
      useStudioStore.setState({ saveState: "error" });
      if (result.error) toast.error("Save failed", result.error);
    }
  } catch {
    if (generation !== saveGeneration) return;
    useStudioStore.setState({ saveState: "error" });
  }
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void runSave();
  }, AUTOSAVE_DELAY_MS);
}

export const useStudioStore = create<StudioStore>((set, get) => {
  /** Snapshot + mutate + mark dirty + schedule autosave. */
  function commit(mutator: (pieces: StudioPiece[]) => StudioPiece[]): void {
    const { pieces, past } = get();
    const nextPast = [...past, clonePieces(pieces)];
    if (nextPast.length > MAX_HISTORY) nextPast.shift();
    set({
      pieces: mutator(clonePieces(pieces)),
      past: nextPast,
      future: [],
      saveState: "dirty",
    });
    scheduleSave();
  }

  return {
    projectId: null,
    pieces: [],
    selection: null,
    past: [],
    future: [],
    saveState: "idle",
    lastSavedAt: null,

    init(projectId, rows) {
      const pieces: StudioPiece[] = rows.map((row, index) => {
        const split = splitWorldPolygon(row.polygon);
        return {
          id: row.id,
          kind: row.kind,
          label: row.label,
          polygon: split.polygon,
          x: split.x,
          y: split.y,
          cutouts: row.cutouts ?? [],
          veinLocked: row.veinLocked,
          sortOrder: row.sortOrder ?? index,
        };
      });
      set({
        projectId,
        pieces,
        selection: null,
        past: [],
        future: [],
        saveState: "idle",
        lastSavedAt: null,
      });
    },

    select(selection) {
      set({ selection });
    },

    addTemplate(key) {
      const { pieces } = get();
      if (pieces.length >= MAX_PIECES) {
        toast.error(`Projects are limited to ${MAX_PIECES} pieces.`);
        return;
      }
      const template = TEMPLATES[key];
      const id = crypto.randomUUID();
      const spot = nextPlacement(pieces);
      commit((prev) => [
        ...prev,
        {
          id,
          kind: template.kind,
          label: template.label,
          polygon: structuredClone(template.polygon) as SfPolygon,
          x: spot.x,
          y: spot.y,
          cutouts: [],
          veinLocked: true,
          sortOrder: prev.length,
        },
      ]);
      set({ selection: { pieceId: id } });
    },

    addCutout(pieceId, key) {
      const template = CUTOUTS[key];
      commit((prev) =>
        prev.map((p) => {
          if (p.id !== pieceId) return p;
          const pieceBb = polygonAabb(p.polygon);
          const cutBb = polygonAabb(template.polygon);
          if (!pieceBb || !cutBb) return p;
          const centered = {
            type: template.type,
            polygon: structuredClone(template.polygon) as SfPolygon,
            offsetX: (pieceBb.widthIn - cutBb.widthIn) / 2,
            offsetY: (pieceBb.heightIn - cutBb.heightIn) / 2,
          };
          const clamped = clampCutoutOffset(
            p.polygon,
            centered,
            centered.offsetX,
            centered.offsetY,
          );
          return {
            ...p,
            cutouts: [...p.cutouts, { ...centered, ...clamped }],
          };
        }),
      );
    },

    movePiece(id, x, y) {
      commit((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, x: snapQuarter(x), y: snapQuarter(y) } : p,
        ),
      );
    },

    moveCutout(pieceId, index, ox, oy) {
      commit((prev) =>
        prev.map((p) => {
          if (p.id !== pieceId) return p;
          const cutout = p.cutouts[index];
          if (!cutout) return p;
          const clamped = clampCutoutOffset(
            p.polygon,
            cutout,
            snapQuarter(ox),
            snapQuarter(oy),
          );
          const cutouts = [...p.cutouts];
          cutouts[index] = { ...cutout, ...clamped };
          return { ...p, cutouts };
        }),
      );
    },

    rotateSelected() {
      const { selection } = get();
      if (!selection) return;
      commit((prev) =>
        prev.map((p) => {
          if (p.id !== selection.pieceId) return p;
          const rotated = rotatePieceWithCutouts(p);
          return { ...p, polygon: rotated.polygon, cutouts: rotated.cutouts };
        }),
      );
    },

    duplicateSelected() {
      const { selection, pieces } = get();
      if (!selection) return;
      if (pieces.length >= MAX_PIECES) {
        toast.error(`Projects are limited to ${MAX_PIECES} pieces.`);
        return;
      }
      const source = pieces.find((p) => p.id === selection.pieceId);
      if (!source) return;
      const id = crypto.randomUUID();
      commit((prev) => [
        ...prev,
        {
          ...structuredClone(source),
          id,
          label: `${source.label} copy`,
          x: snapQuarter(source.x + PLACEMENT_GAP_IN),
          y: snapQuarter(source.y + PLACEMENT_GAP_IN),
          sortOrder: prev.length,
        },
      ]);
      set({ selection: { pieceId: id } });
    },

    deleteSelected() {
      const { selection } = get();
      if (!selection) return;
      if (selection.cutoutIndex !== undefined) {
        const cutoutIndex = selection.cutoutIndex;
        commit((prev) =>
          prev.map((p) =>
            p.id === selection.pieceId
              ? {
                  ...p,
                  cutouts: p.cutouts.filter((_, i) => i !== cutoutIndex),
                }
              : p,
          ),
        );
        set({ selection: { pieceId: selection.pieceId } });
      } else {
        commit((prev) => prev.filter((p) => p.id !== selection.pieceId));
        set({ selection: null });
      }
    },

    resizePieceEdge(pieceId, edgeIndex, newLen) {
      const { pieces } = get();
      const piece = pieces.find((p) => p.id === pieceId);
      if (!piece) return false;
      const resized = resizeEdgeGeometry(piece.polygon, edgeIndex, newLen);
      if (!resized) return false;
      // Re-normalize (a resize can move vertices below the origin) and
      // keep the world anchor stable.
      const split = splitWorldPolygon(resized);
      commit((prev) =>
        prev.map((p) =>
          p.id === pieceId
            ? {
                ...p,
                polygon: split.polygon,
                x: snapQuarter(p.x + split.x),
                y: snapQuarter(p.y + split.y),
                cutouts: p.cutouts.map((c) => ({
                  ...c,
                  ...clampCutoutOffset(split.polygon, c, c.offsetX, c.offsetY),
                })),
              }
            : p,
        ),
      );
      return true;
    },

    renamePiece(id, label) {
      const trimmed = label.trim();
      if (!trimmed) return;
      commit((prev) =>
        prev.map((p) => (p.id === id ? { ...p, label: trimmed.slice(0, 120) } : p)),
      );
    },

    importPieces(imported) {
      const { pieces } = get();
      if (imported.length === 0) return;
      if (pieces.length + imported.length > MAX_PIECES) {
        toast.error(
          `Import would exceed the ${MAX_PIECES}-piece limit for a project.`,
        );
        return;
      }
      commit((prev) => {
        const next = [...prev];
        for (const piece of imported) {
          const polygon =
            normalizeVertices(piece.vertices) ??
            rectPolygon(piece.widthIn, piece.heightIn);
          const split = splitWorldPolygon(polygon);
          const spot = nextPlacement(next);
          next.push({
            id: crypto.randomUUID(),
            kind: "countertop",
            label: piece.label || `Piece ${next.length + 1}`,
            polygon: split.polygon,
            x: spot.x,
            y: spot.y,
            cutouts: [],
            veinLocked: true,
            sortOrder: next.length,
          });
        }
        return next;
      });
      toast.success(
        `Imported ${imported.length} piece${imported.length === 1 ? "" : "s"}.`,
      );
    },

    undo() {
      const { past, pieces, future } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        pieces: previous,
        past: past.slice(0, -1),
        future: [clonePieces(pieces), ...future],
        selection: null,
        saveState: "dirty",
      });
      scheduleSave();
    },

    redo() {
      const { future, pieces, past } = get();
      const next = future[0];
      if (!next) return;
      set({
        pieces: next,
        future: future.slice(1),
        past: [...past, clonePieces(pieces)],
        selection: null,
        saveState: "dirty",
      });
      scheduleSave();
    },

    async flushSave() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      const { saveState } = get();
      if (saveState === "dirty" || saveState === "error") {
        await runSave();
      }
    },
  };
});
