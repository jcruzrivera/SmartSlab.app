"use client";

import { Line } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import type { SfCutout, SfPolygon } from "@/lib/db/sfTypes";
import { clampCutoutOffset } from "@/lib/studio/piece-geometry";
import { useStudioStore } from "@/components/studio/studio-store";

function flatten(polygon: SfPolygon): number[] {
  const points: number[] = [];
  for (const v of polygon) {
    points.push(v.x, v.y);
  }
  return points;
}

export function CutoutShape({
  pieceId,
  piecePolygon,
  cutout,
  index,
  selected,
  stageScale,
}: {
  pieceId: string;
  piecePolygon: SfPolygon;
  cutout: SfCutout;
  index: number;
  selected: boolean;
  stageScale: number;
}) {
  const select = useStudioStore((s) => s.select);
  const moveCutout = useStudioStore((s) => s.moveCutout);

  function handleDragMove(event: KonvaEventObject<DragEvent>) {
    const node = event.target as Konva.Line;
    const clamped = clampCutoutOffset(
      piecePolygon,
      cutout,
      node.x(),
      node.y(),
    );
    node.position({ x: clamped.offsetX, y: clamped.offsetY });
  }

  function handleDragEnd(event: KonvaEventObject<DragEvent>) {
    const node = event.target as Konva.Line;
    moveCutout(pieceId, index, node.x(), node.y());
  }

  return (
    <Line
      x={cutout.offsetX}
      y={cutout.offsetY}
      points={flatten(cutout.polygon)}
      closed
      fill={selected ? "rgba(15, 118, 110, 0.25)" : "rgba(100, 116, 139, 0.15)"}
      stroke={selected ? "#0f766e" : "#64748b"}
      strokeWidth={(selected ? 1.5 : 1) / stageScale}
      dash={[4 / stageScale, 3 / stageScale]}
      draggable
      onClick={(event) => {
        event.cancelBubble = true;
        select({ pieceId, cutoutIndex: index });
      }}
      onTap={(event) => {
        event.cancelBubble = true;
        select({ pieceId, cutoutIndex: index });
      }}
      onDragStart={() => select({ pieceId, cutoutIndex: index })}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  );
}
