/**
 * JSON-column payload types for the Layout Studio (`sf_*`) tables.
 *
 * Polygons use `{x,y}[]` — matching lib/smartfinder's PieceVertex convention —
 * so every existing geometry helper (polygonAreaSqIn, polygonAabb, the
 * lib/nesting engine) works on DB-loaded polygons with zero translation.
 */

export type SfPoint = { x: number; y: number };
export type SfPolygon = SfPoint[];

export type SfCutout = {
  type: "sink" | "cooktop" | "faucet" | "custom";
  polygon: SfPolygon;
  offsetX: number;
  offsetY: number;
};

/** Set on sf_placements when nested against a virtual/generic slab (no slabId). */
export type SfVirtualSlab = {
  widthIn: number;
  heightIn: number;
  material?: string;
  price?: number;
};

/** Frozen copy of the geometry actually nested, so editing/deleting the
 * source sf_pieces row later can't silently rewrite a historical layout's
 * placements (e.g. after a quote has been accepted). */
export type SfPieceSnapshot = {
  polygon: SfPolygon;
  veinLocked: boolean;
  kind: string;
};
