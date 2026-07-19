"use client";

import { Group, Line, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { CutoutShape } from "@/components/studio/cutout-shape";
import type { DimensionEditTarget } from "@/components/studio/studio-canvas";
import {
  useStudioStore,
  type StudioPiece,
} from "@/components/studio/studio-store";
import type { SfPolygon } from "@/lib/db/sfTypes";
import { polygonAabb } from "@/lib/smartfinder/geometry";
import { formatInches } from "@/lib/studio/fractions";
import { edgeLength, isRectilinear } from "@/lib/studio/piece-geometry";

const MIN_LABELED_EDGE_IN = 3;

function flatten(polygon: SfPolygon): number[] {
  const points: number[] = [];
  for (const v of polygon) {
    points.push(v.x, v.y);
  }
  return points;
}

/** Shoelace sum — positive means "clockwise on screen" for y-down coords. */
function signedArea(polygon: SfPolygon): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum;
}

function DimensionLabels({
  piece,
  stageScale,
  editable,
  onEditDimension,
}: {
  piece: StudioPiece;
  stageScale: number;
  editable: boolean;
  onEditDimension: (target: DimensionEditTarget) => void;
}) {
  const polygon = piece.polygon;
  const outwardSign = signedArea(polygon) > 0 ? 1 : -1;
  const fontSize = 12 / stageScale;
  const offset = 10 / stageScale;

  const labels: React.ReactElement[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const len = edgeLength(polygon, i);
    if (len < MIN_LABELED_EDGE_IN) continue;

    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dirX = (b.x - a.x) / len;
    const dirY = (b.y - a.y) / len;
    // Outward normal for the polygon's winding.
    const normalX = outwardSign * dirY;
    const normalY = outwardSign * -dirX;

    const text = `${formatInches(len)}"`;
    const approxWidth = text.length * fontSize * 0.55;

    labels.push(
      <Text
        key={`dim${i}`}
        x={midX + normalX * offset - approxWidth / 2}
        y={midY + normalY * offset - fontSize / 2}
        text={text}
        fontSize={fontSize}
        fill={editable ? "#0f766e" : "#94a3b8"}
        onClick={(event) => {
          if (!editable) return;
          event.cancelBubble = true;
          const stage = event.target.getStage();
          const pointer = stage?.getPointerPosition();
          onEditDimension({
            pieceId: piece.id,
            edgeIndex: i,
            screenX: pointer?.x ?? 0,
            screenY: pointer?.y ?? 0,
            currentLen: len,
          });
        }}
        onMouseEnter={(event) => {
          const container = event.target.getStage()?.container();
          if (container) {
            container.style.cursor = editable ? "pointer" : "not-allowed";
          }
        }}
        onMouseLeave={(event) => {
          const container = event.target.getStage()?.container();
          if (container) container.style.cursor = "default";
        }}
      />,
    );
  }

  return <>{labels}</>;
}

export function PieceShape({
  piece,
  stageScale,
  onEditDimension,
}: {
  piece: StudioPiece;
  stageScale: number;
  onEditDimension: (target: DimensionEditTarget) => void;
}) {
  const selection = useStudioStore((s) => s.selection);
  const select = useStudioStore((s) => s.select);
  const movePiece = useStudioStore((s) => s.movePiece);
  const renamePiece = useStudioStore((s) => s.renamePiece);

  const pieceSelected = selection?.pieceId === piece.id;
  const bodySelected = pieceSelected && selection?.cutoutIndex === undefined;
  const editable = isRectilinear(piece.polygon);
  const aabb = polygonAabb(piece.polygon);

  function handleSelect(event: KonvaEventObject<MouseEvent | Event>) {
    event.cancelBubble = true;
    select({ pieceId: piece.id });
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    const node = event.target as Konva.Group;
    movePiece(piece.id, node.x(), node.y());
  }

  function handleRename(event: KonvaEventObject<MouseEvent | TouchEvent>) {
    event.cancelBubble = true;
    const name = window.prompt("Piece name", piece.label);
    if (name) renamePiece(piece.id, name);
  }

  return (
    <Group
      x={piece.x}
      y={piece.y}
      draggable
      onClick={handleSelect}
      onTap={handleSelect}
      onDragStart={handleSelect}
      onDragEnd={handleDragEnd}
    >
      <Line
        points={flatten(piece.polygon)}
        closed
        fill={
          bodySelected ? "rgba(13, 148, 136, 0.28)" : "rgba(13, 148, 136, 0.16)"
        }
        stroke={bodySelected ? "#0d9488" : "#475569"}
        strokeWidth={(bodySelected ? 2 : 1) / stageScale}
      />
      {piece.cutouts.map((cutout, index) => (
        <CutoutShape
          key={index}
          pieceId={piece.id}
          piecePolygon={piece.polygon}
          cutout={cutout}
          index={index}
          selected={pieceSelected && selection?.cutoutIndex === index}
          stageScale={stageScale}
        />
      ))}
      <DimensionLabels
        piece={piece}
        stageScale={stageScale}
        editable={editable}
        onEditDimension={onEditDimension}
      />
      {aabb ? (
        <Text
          x={aabb.minX + aabb.widthIn / 2 - (piece.label.length * (11 / stageScale) * 0.55) / 2}
          y={aabb.minY + aabb.heightIn / 2 - 11 / stageScale / 2}
          text={piece.label}
          fontSize={11 / stageScale}
          fontStyle="bold"
          fill="#334155"
          onDblClick={handleRename}
          onDblTap={handleRename}
        />
      ) : null}
    </Group>
  );
}
