"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { DimensionInputOverlay } from "@/components/studio/dimension-input-overlay";
import { PieceShape } from "@/components/studio/piece-shape";
import { useStudioStore } from "@/components/studio/studio-store";

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const FIT_WIDTH_IN = 300;
const CANVAS_HEIGHT_PX = 600;

export type DimensionEditTarget = {
  pieceId: string;
  edgeIndex: number;
  screenX: number;
  screenY: number;
  currentLen: number;
} | null;

function GridLayer({
  scale,
  offsetX,
  offsetY,
  widthPx,
  heightPx,
}: {
  scale: number;
  offsetX: number;
  offsetY: number;
  widthPx: number;
  heightPx: number;
}) {
  const lines: React.ReactElement[] = [];

  const worldLeft = -offsetX / scale;
  const worldTop = -offsetY / scale;
  const worldRight = worldLeft + widthPx / scale;
  const worldBottom = worldTop + heightPx / scale;

  const showMinor = scale > 2;
  const minorStep = 1;
  const majorStep = 12;

  const startX = Math.floor(worldLeft / majorStep) * majorStep;
  const startY = Math.floor(worldTop / majorStep) * majorStep;

  if (showMinor) {
    for (let x = Math.floor(worldLeft); x <= worldRight; x += minorStep) {
      if (x % majorStep === 0) continue;
      lines.push(
        <Line
          key={`mx${x}`}
          points={[x, worldTop, x, worldBottom]}
          stroke="#e2e8f0"
          strokeWidth={0.5 / scale}
          listening={false}
        />,
      );
    }
    for (let y = Math.floor(worldTop); y <= worldBottom; y += minorStep) {
      if (y % majorStep === 0) continue;
      lines.push(
        <Line
          key={`my${y}`}
          points={[worldLeft, y, worldRight, y]}
          stroke="#e2e8f0"
          strokeWidth={0.5 / scale}
          listening={false}
        />,
      );
    }
  }

  for (let x = startX; x <= worldRight; x += majorStep) {
    lines.push(
      <Line
        key={`Mx${x}`}
        points={[x, worldTop, x, worldBottom]}
        stroke="#cbd5e1"
        strokeWidth={1 / scale}
        listening={false}
      />,
    );
  }
  for (let y = startY; y <= worldBottom; y += majorStep) {
    lines.push(
      <Line
        key={`My${y}`}
        points={[worldLeft, y, worldRight, y]}
        stroke="#cbd5e1"
        strokeWidth={1 / scale}
        listening={false}
      />,
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
}

export function StudioCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: CANVAS_HEIGHT_PX });
  const [view, setView] = useState({ scale: 2.5, x: 40, y: 40 });
  const [dimensionTarget, setDimensionTarget] =
    useState<DimensionEditTarget>(null);

  const pieces = useStudioStore((s) => s.pieces);
  const select = useStudioStore((s) => s.select);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 800;
      setSize({ width, height: CANVAS_HEIGHT_PX });
      setView((v) => {
        // Initial fit: FIT_WIDTH_IN inches across the container width.
        if (v.scale === 2.5 && width > 0) {
          return { ...v, scale: Math.max(MIN_SCALE, width / FIT_WIDTH_IN) };
        }
        return v;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleWheel = useCallback((event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    setView((v) => {
      const direction = event.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.08;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, direction > 0 ? v.scale * factor : v.scale / factor),
      );
      // Zoom toward the pointer.
      const worldX = (pointer.x - v.x) / v.scale;
      const worldY = (pointer.y - v.y) / v.scale;
      return {
        scale: newScale,
        x: pointer.x - worldX * newScale,
        y: pointer.y - worldY * newScale,
      };
    });
  }, []);

  const handleStageClick = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (event.target === event.target.getStage()) {
        select(null);
        setDimensionTarget(null);
      }
    },
    [select],
  );

  const handleStageDragEnd = useCallback(
    (event: KonvaEventObject<DragEvent>) => {
      const stage = event.target.getStage();
      if (event.target !== stage || !stage) return;
      setView((v) => ({ ...v, x: stage.x(), y: stage.y() }));
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
      style={{ height: CANVAS_HEIGHT_PX }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleStageDragEnd}
      >
        <GridLayer
          scale={view.scale}
          offsetX={view.x}
          offsetY={view.y}
          widthPx={size.width}
          heightPx={size.height}
        />
        <Layer>
          {pieces.map((piece) => (
            <PieceShape
              key={piece.id}
              piece={piece}
              stageScale={view.scale}
              onEditDimension={setDimensionTarget}
            />
          ))}
        </Layer>
      </Stage>
      <DimensionInputOverlay
        target={dimensionTarget}
        onClose={() => setDimensionTarget(null)}
      />
    </div>
  );
}
