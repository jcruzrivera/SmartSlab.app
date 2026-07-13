import type { SlabWithRelations } from "@/lib/db/slabs";

/* ------------------------------------------------------------------ */
/*  Piece — a cut the buyer needs (rect or polygon with AABB)         */
/* ------------------------------------------------------------------ */

export type PieceVertex = {
  /** X in inches (drawing space) */
  x: number;
  /** Y in inches (drawing space) */
  y: number;
};

export type Piece = {
  /** Human label, e.g. "Kitchen counter" */
  label: string;
  /** Width in inches (AABB when vertices are present) */
  widthIn: number;
  /** Height (length) in inches (AABB when vertices are present) */
  heightIn: number;
  /**
   * Optional closed polygon in inches. When present this is the true cut
   * outline; widthIn/heightIn are the axis-aligned bounding box used by
   * rectangular fit/nest until polygon nesting ships.
   */
  vertices?: PieceVertex[];
};

/* ------------------------------------------------------------------ */
/*  Presets — common countertop/surface shapes                        */
/* ------------------------------------------------------------------ */

export type PiecePreset = Piece & { id: string };

export const PIECE_PRESETS: PiecePreset[] = [
  { id: "counter-96x26", label: "Standard countertop", widthIn: 96, heightIn: 26 },
  { id: "island-48x36", label: "Kitchen island", widthIn: 48, heightIn: 36 },
  { id: "backsplash-96x6", label: "Backsplash", widthIn: 96, heightIn: 6 },
  { id: "vanity-48x22", label: "Bathroom vanity", widthIn: 48, heightIn: 22 },
  { id: "bar-60x26", label: "Bar top", widthIn: 60, heightIn: 26 },
  { id: "fireplace-60x20", label: "Fireplace surround", widthIn: 60, heightIn: 20 },
];

/* ------------------------------------------------------------------ */
/*  FitResult — how well a slab matches the buyer's pieces            */
/* ------------------------------------------------------------------ */

export type FitResult = {
  slab: SlabWithRelations;
  /** 0 – 100, higher is better */
  fitScore: number;
  /** Sum of all pieces in sq ft */
  totalPieceSqft: number;
  /** Slab face area in sq ft */
  slabSqft: number;
  /** Percentage of material wasted after cutting all pieces */
  wastePercent: number;
  /** true when all pieces geometrically fit within the slab face */
  fits: boolean;
  /** Pieces that do NOT fit (too wide or too tall for the slab) */
  oversizedPieces: string[];
  /** Estimated price per sq ft of usable material */
  pricePerUsableSqft: number | null;
};

/* ------------------------------------------------------------------ */
/*  SmartFinderResult — serialised slab match for the client          */
/* ------------------------------------------------------------------ */

export type SmartFinderResult = {
  slabId: string;
  slabName: string;
  materialName: string | null;
  colorFamily: string | null;
  vendorCompany: string | null;
  vendorId: string;
  isOwnListing: boolean;
  status: string;
  imageUrl: string | null;
  price: string | null;
  pricePerSqft: string | null;
  type: string;
  widthIn: string | null;
  heightIn: string | null;
  city: string | null;
  state: string | null;
  fitScore: number;
  totalPieceSqft: number;
  slabSqft: number;
  wastePercent: number;
  fits: boolean;
  oversizedPieces: string[];
  pricePerUsableSqft: number | null;
  isNegotiable: boolean;
  quantity: number;
};

/* ------------------------------------------------------------------ */
/*  SmartFinder project — full client-side state                      */
/* ------------------------------------------------------------------ */

export type SmartFinderProject = {
  /** Optional photo of the space (kept as an object URL, never uploaded) */
  imageUrl: string | null;
  /** Pieces the buyer needs to cut */
  pieces: Piece[];
};
