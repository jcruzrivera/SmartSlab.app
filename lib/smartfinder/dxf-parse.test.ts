import { describe, expect, it } from "vitest";

import { parseDxfPieces } from "./dxf-parse";

/**
 * Minimal ASCII DXF: one closed L-shaped LWPOLYLINE (inches) + a TEXT label.
 * Outer path: (0,0)-(60,0)-(60,20)-(20,20)-(20,40)-(0,40)-back to (0,0)
 */
function lShapeDxf(insunits = 1): string {
  return `0
SECTION
2
HEADER
9
$INSUNITS
70
${insunits}
0
ENDSEC
0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
6
70
1
10
0
20
0
10
60
20
0
10
60
20
20
10
20
20
20
10
20
20
40
10
0
20
40
0
TEXT
8
0
10
8
20
10
40
12
1
Kitchen L
0
ENDSEC
0
EOF
`;
}

describe("parseDxfPieces", () => {
  it("extracts one L-shaped piece with real vertices (no rectangle split)", () => {
    const { pieces, unitsDetected } = parseDxfPieces(lShapeDxf(1));

    expect(unitsDetected).toBe("in");
    expect(pieces).toHaveLength(1);

    const piece = pieces[0]!;
    expect(piece.label).toBe("Kitchen L");
    expect(piece.widthIn).toBe(60);
    expect(piece.heightIn).toBe(40);
    expect(piece.vertices).toBeDefined();
    expect(piece.vertices!.length).toBeGreaterThanOrEqual(6);

    // Must remain a single piece — not two arbitrary rectangles.
    expect(pieces.filter((p) => p.label.includes("Piece")).length).toBe(0);
  });

  it("converts millimeters via $INSUNITS", () => {
    // Same L geometry expressed in mm (60in = 1524mm, 40in = 1016mm).
    const dxf = `0
SECTION
2
HEADER
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
6
70
1
10
0
20
0
10
1524
20
0
10
1524
20
508
10
508
20
508
10
508
20
1016
10
0
20
1016
0
ENDSEC
0
EOF
`;
    const { pieces, unitsDetected } = parseDxfPieces(dxf);
    expect(unitsDetected).toBe("mm");
    expect(pieces).toHaveLength(1);
    expect(pieces[0]!.widthIn).toBeCloseTo(60, 0);
    expect(pieces[0]!.heightIn).toBeCloseTo(40, 0);
    expect(pieces[0]!.vertices!.length).toBeGreaterThanOrEqual(6);
  });

  it("ignores open polylines", () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
0
90
3
70
0
10
0
20
0
10
10
20
0
10
10
20
10
0
ENDSEC
0
EOF
`;
    const { pieces } = parseDxfPieces(dxf);
    expect(pieces).toHaveLength(0);
  });

  it("returns empty for non-DXF text", () => {
    expect(parseDxfPieces("not a dxf").pieces).toEqual([]);
  });
});
