import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";
import { rectPolygon } from "@/lib/smartfinder/geometry";

type PieceKind = "countertop" | "backsplash" | "island" | "other";

export type PieceTemplate = {
  label: string;
  kind: PieceKind;
  polygon: SfPolygon;
};

/** Default piece templates (inches). L-shape: 113.5in main run x 25.25 deep,
 * return leg 36in wide extending to 61.25in total depth. */
export const TEMPLATES = {
  rect: {
    label: "Countertop",
    kind: "countertop",
    polygon: rectPolygon(72, 25.25),
  },
  lshape: {
    label: "L countertop",
    kind: "countertop",
    polygon: [
      { x: 0, y: 0 },
      { x: 113.5, y: 0 },
      { x: 113.5, y: 25.25 },
      { x: 36, y: 25.25 },
      { x: 36, y: 61.25 },
      { x: 0, y: 61.25 },
    ],
  },
  island: {
    label: "Island",
    kind: "island",
    polygon: rectPolygon(120, 25.25),
  },
} as const satisfies Record<string, PieceTemplate>;

export type TemplateKey = keyof typeof TEMPLATES;

export type CutoutTemplate = Omit<SfCutout, "offsetX" | "offsetY">;

export const CUTOUTS = {
  sink: { type: "sink", polygon: rectPolygon(33, 22) },
  cooktop: { type: "cooktop", polygon: rectPolygon(30, 21) },
  custom: { type: "custom", polygon: rectPolygon(12, 12) },
} as const satisfies Record<string, CutoutTemplate>;

export type CutoutKey = keyof typeof CUTOUTS;
