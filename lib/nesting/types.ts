export type Point = { x: number; y: number };

export type NestCutout = {
  type: "sink" | "cooktop" | "faucet" | "custom";
  polygon: Point[];
  offsetX: number;
  offsetY: number;
};

export type NestPiece = {
  /** Caller-chosen stable id (typically sf_pieces.id) — unplaced pieces are
   * reported by identity, not just by label text. */
  id: string;
  label: string;
  /** Rectilinear polygon, inches. */
  polygon: Point[];
  /** true = piece may only be placed at 0°/180° (grain direction locked). */
  veinLocked: boolean;
  /** Pass-through metadata only — interior to the piece footprint, so v1
   * nest() ignores cutouts for collision/placement purposes. */
  cutouts?: NestCutout[];
};

export type SlabSource =
  | { kind: "real"; slabId: string; widthIn: number; heightIn: number }
  | {
      kind: "virtual";
      widthIn: number;
      heightIn: number;
      material?: string;
      price?: number;
    };

export type NestPlacement = {
  pieceId: string;
  /** 1-based position within the effective slab sequence actually used. */
  slabIndex: number;
  slab: SlabSource;
  xIn: number;
  yIn: number;
  rotation: 0 | 90 | 180 | 270;
  /** Absolute placed polygon (post-rotation, post-translation), inches. */
  polygon: Point[];
};

export type NestUnplacedReason = "no_slab_fits" | "no_room_on_any_slab";

export type NestError = {
  pieceId: string;
  label: string;
  reason: NestUnplacedReason;
  message: string;
};

export type VirtualSlabTemplate = {
  widthIn: number;
  heightIn: number;
  material?: string;
  price?: number;
};

export type NestInput = {
  pieces: NestPiece[];
  /** Ordered candidate list, first preferred. */
  slabs: SlabSource[];
  /** Applied as both the slab-edge buffer and the minimum piece-to-piece
   * gap (kerf is already accounted for inside this value — see
   * lib/db/schema.ts's sfLayouts.kerfIn doc). */
  marginIn: number;
  allowNewVirtualSlabs: boolean;
  /** Required when allowNewVirtualSlabs is true and the provided slab list
   * runs out. nest() throws immediately if allowNewVirtualSlabs is true and
   * this is missing, rather than guessing a size from the last candidate. */
  virtualSlabTemplate?: VirtualSlabTemplate;
};

export type NestResult = {
  placements: NestPlacement[];
  slabsUsed: number;
  slabsUsedList: SlabSource[];
  totalPieceSqft: number;
  /** Sum of area of only the slabs actually consumed, not the whole
   * candidate list. */
  totalSlabSqft: number;
  wastePct: number;
  unplaced: NestError[];
};
