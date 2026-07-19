import { z } from "zod";

const coord = z.number().finite().min(-1000).max(1000);

const pointSchema = z.object({ x: coord, y: coord });

const polygonSchema = z.array(pointSchema).min(3).max(64);

const cutoutSchema = z.object({
  type: z.enum(["sink", "cooktop", "faucet", "custom"]),
  polygon: polygonSchema,
  offsetX: coord,
  offsetY: coord,
});

export const savePieceSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["countertop", "backsplash", "island", "other"]),
  label: z.string().trim().min(1).max(120),
  polygon: polygonSchema,
  cutouts: z.array(cutoutSchema).max(10),
  veinLocked: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export const savePiecesSchema = z.object({
  projectId: z.string().uuid(),
  pieces: z.array(savePieceSchema).max(50),
});

export const projectNameSchema = z.string().trim().min(1).max(80);

export type SavePieceInput = z.infer<typeof savePieceSchema>;
export type SavePiecesInput = z.infer<typeof savePiecesSchema>;
