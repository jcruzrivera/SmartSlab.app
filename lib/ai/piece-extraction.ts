import type { Piece } from "@/lib/smartfinder/types";

/*
 * Piece extraction — reads a construction/shop drawing (PDF), a CAD export
 * (DXF, text), or a photo/plan image and returns the list of flat stone pieces
 * to fabricate, so SmartFinder can pre-fill the "Define your pieces" step.
 *
 * Reuses the same provider strategy as lib/ai/slab-analysis.ts (OpenAI or
 * Anthropic, whichever key is present). Everything degrades gracefully: with no
 * key configured, callers keep the manual flow.
 */

export type PieceExtractionInput =
  | { kind: "image"; base64: string; mediaType: string }
  | { kind: "pdf"; base64: string }
  | { kind: "dxf"; text: string };

export type PieceExtractionResult = {
  pieces: Piece[];
  provider: "openai" | "anthropic" | null;
  unitsDetected?: string;
};

const MAX_PIECES = 20;
const MAX_DIM_IN = 600;
// DXF files can be large; cap the text we send to keep token usage sane.
const MAX_DXF_CHARS = 160_000;

const EXTRACTION_PROMPT = `You extract the list of flat stone pieces (countertops, kitchen islands, bar tops, bathroom vanities, backsplashes, fireplace surrounds, thresholds, etc.) that a fabricator needs to cut from stone slabs, based on a construction drawing, shop drawing, cut list, CAD export, or photo of a plan.

Return JSON ONLY in exactly this shape:
{ "pieces": [ { "label": string, "widthIn": number, "heightIn": number } ], "unitsDetected": string }

Rules:
- widthIn and heightIn are the piece's two rectangular dimensions expressed in INCHES. If the drawing uses millimeters, centimeters, meters or feet, convert to inches (1 in = 25.4 mm = 2.54 cm; 1 ft = 12 in).
- "unitsDetected": the source units you detected ("in", "mm", "cm", "m", or "ft"); use "unknown" if unclear.
- label: a short human name (e.g. "Kitchen counter", "Island", "Backsplash"). If a piece has no name, use "Piece 1", "Piece 2", etc.
- Only include flat pieces meant to be fabricated from stone slabs. Ignore walls, cabinets, appliances, room dimensions and annotation text that are not stone pieces.
- Maximum 20 pieces. Skip a piece if you cannot determine BOTH dimensions.
- If you cannot identify any stone pieces, return { "pieces": [], "unitsDetected": "unknown" }.
- Do not include any prose, explanation or markdown — JSON only.`;

function clampDim(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_DIM_IN) return null;
  return Math.round(n * 100) / 100;
}

export function parsePiecesJson(raw: string): {
  pieces: Piece[];
  unitsDetected?: string;
} {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? raw) as Record<string, unknown>;
    const rawPieces = Array.isArray(parsed.pieces) ? parsed.pieces : [];
    const pieces: Piece[] = [];

    for (const item of rawPieces) {
      if (pieces.length >= MAX_PIECES) break;
      if (typeof item !== "object" || item === null) continue;
      const { label, widthIn, heightIn } = item as Record<string, unknown>;
      const w = clampDim(widthIn);
      const h = clampDim(heightIn);
      if (w === null || h === null) continue;
      const cleanLabel =
        typeof label === "string" && label.trim()
          ? label.trim().slice(0, 60)
          : `Piece ${pieces.length + 1}`;
      pieces.push({ label: cleanLabel, widthIn: w, heightIn: h });
    }

    const unitsDetected =
      typeof parsed.unitsDetected === "string"
        ? parsed.unitsDetected.trim().slice(0, 20)
        : undefined;

    return { pieces, unitsDetected };
  } catch {
    return { pieces: [] };
  }
}

/* ------------------------------------------------------------------ */
/*  Providers                                                          */
/* ------------------------------------------------------------------ */

function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function isPieceExtractionConfigured(): boolean {
  return hasOpenAI() || hasAnthropic();
}

type OpenAIContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function openaiChat(content: OpenAIContent[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI extraction failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "{}";
}

async function openaiPdf(base64: string): Promise<string> {
  // Chat Completions cannot read PDFs; the Responses API accepts input_file.
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: EXTRACTION_PROMPT },
            {
              type: "input_file",
              filename: "plan.pdf",
              file_data: `data:application/pdf;base64,${base64}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI PDF extraction failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type: string; text?: string }> }>;
  };
  if (typeof data.output_text === "string" && data.output_text) {
    return data.output_text;
  }
  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .find((block) => block.type === "output_text")?.text;
  return text ?? "{}";
}

type AnthropicContent =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

async function anthropicMessage(content: AnthropicContent[]): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_VISION_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude extraction failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return data.content?.find((block) => block.type === "text")?.text ?? "{}";
}

/* ------------------------------------------------------------------ */
/*  Public entrypoint                                                  */
/* ------------------------------------------------------------------ */

async function runOpenAI(input: PieceExtractionInput): Promise<string> {
  if (input.kind === "image") {
    return openaiChat([
      { type: "text", text: EXTRACTION_PROMPT },
      {
        type: "image_url",
        image_url: { url: `data:${input.mediaType};base64,${input.base64}` },
      },
    ]);
  }
  if (input.kind === "pdf") {
    return openaiPdf(input.base64);
  }
  return openaiChat([
    {
      type: "text",
      text: `${EXTRACTION_PROMPT}\n\nDXF file contents follow:\n${input.text.slice(0, MAX_DXF_CHARS)}`,
    },
  ]);
}

async function runAnthropic(input: PieceExtractionInput): Promise<string> {
  if (input.kind === "image") {
    return anthropicMessage([
      {
        type: "image",
        source: {
          type: "base64",
          media_type: input.mediaType,
          data: input.base64,
        },
      },
      { type: "text", text: `${EXTRACTION_PROMPT}\nRespond with JSON only.` },
    ]);
  }
  if (input.kind === "pdf") {
    return anthropicMessage([
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: input.base64,
        },
      },
      { type: "text", text: `${EXTRACTION_PROMPT}\nRespond with JSON only.` },
    ]);
  }
  return anthropicMessage([
    {
      type: "text",
      text: `${EXTRACTION_PROMPT}\n\nDXF file contents follow:\n${input.text.slice(0, MAX_DXF_CHARS)}`,
    },
  ]);
}

export async function extractPieces(
  input: PieceExtractionInput,
): Promise<PieceExtractionResult> {
  // Anthropic reads PDFs natively; prefer it for PDFs when available.
  const preferAnthropicForPdf = input.kind === "pdf" && hasAnthropic();

  if (!preferAnthropicForPdf && hasOpenAI()) {
    const { pieces, unitsDetected } = parsePiecesJson(await runOpenAI(input));
    return { pieces, unitsDetected, provider: "openai" };
  }

  if (hasAnthropic()) {
    const { pieces, unitsDetected } = parsePiecesJson(await runAnthropic(input));
    return { pieces, unitsDetected, provider: "anthropic" };
  }

  if (hasOpenAI()) {
    const { pieces, unitsDetected } = parsePiecesJson(await runOpenAI(input));
    return { pieces, unitsDetected, provider: "openai" };
  }

  return { pieces: [], provider: null };
}
