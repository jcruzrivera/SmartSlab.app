import { NextResponse } from "next/server";

import { getClerkUserId } from "@/lib/auth/session";
import {
  extractPieces,
  isPieceExtractionConfigured,
  type PieceExtractionInput,
} from "@/lib/ai/piece-extraction";

const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function GET(): Promise<NextResponse> {
  const userId = await getClerkUserId();
  return NextResponse.json({
    configured: isPieceExtractionConfigured(),
    // Geometric DXF parsing works without AI provider keys.
    dxfSupported: true,
    signedIn: Boolean(userId),
  });
}

function detectKind(
  name: string,
  type: string,
): "image" | "pdf" | "dxf" | null {
  const lower = name.toLowerCase();
  if (type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    lower.endsWith(".dxf") ||
    type === "application/dxf" ||
    type === "application/x-dxf" ||
    type === "image/vnd.dxf"
  ) {
    return "dxf";
  }
  if (ALLOWED_IMAGE_TYPES.has(type) || /\.(jpe?g|png|webp|gif)$/.test(lower)) {
    return "image";
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (value instanceof File) {
      file = value;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid upload." },
      { status: 400 },
    );
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 12 MB)." },
      { status: 413 },
    );
  }

  const kind = detectKind(file.name ?? "", file.type ?? "");
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF, DXF, or image." },
      { status: 415 },
    );
  }

  // DXF has a geometric parser that needs no AI keys; PDF/image still need AI.
  if (kind !== "dxf" && !isPieceExtractionConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI extraction is not configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        configured: false,
      },
      { status: 503 },
    );
  }

  let input: PieceExtractionInput;
  try {
    if (kind === "dxf") {
      input = { kind: "dxf", text: await file.text() };
    } else {
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      input =
        kind === "pdf"
          ? { kind: "pdf", base64 }
          : {
              kind: "image",
              base64,
              mediaType: ALLOWED_IMAGE_TYPES.has(file.type)
                ? file.type
                : "image/png",
            };
    }
  } catch {
    return NextResponse.json(
      { error: "Could not read the file." },
      { status: 400 },
    );
  }

  try {
    const { pieces, provider, unitsDetected } = await extractPieces(input);
    return NextResponse.json({ pieces, provider, unitsDetected, kind });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not extract pieces from the file.",
      },
      { status: 502 },
    );
  }
}
