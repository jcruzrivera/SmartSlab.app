import { AESTHETIC_VALUES, ROOM_VALUES } from "@/lib/search/filters";
import { computeSqft } from "@/lib/format";

export type SlabImageAnalysis = {
  name?: string;
  type?: "full_slab" | "remnant";
  material?: string;
  finish?: string;
  colorFamily?: string;
  brandSupplier?: string;
  widthIn?: number;
  heightIn?: number;
  thicknessCm?: number;
  suggestedPriceUsd?: number;
  priceNote?: string;
  roomUse?: string[];
  aestheticTags?: string[];
  notes?: string;
};

const ANALYSIS_PROMPT = `You analyze photos of stone slabs and remnants for a US marketplace listing.
Return JSON only with these optional fields:
- name: short listing title (e.g. "Calacatta Gold Quartz Remnant")
- type: "full_slab" or "remnant"
- material: one of Granite, Quartz, Quartzite, Marble, Dolomite, Other
- finish: one of polished, honed, leathered, brushed, sandblasted, other
- colorFamily: short color description (e.g. white, gray, beige)
- brandSupplier: brand or supplier if visible on the slab or packaging
- widthIn: estimated width in inches if reasonably inferable from the photo
- heightIn: estimated height in inches if reasonably inferable from the photo
- thicknessCm: estimated thickness in centimeters if visible or typical for the material
- suggestedPriceUsd: suggested list price in whole US dollars for this piece (remnants usually lower than full slabs)
- priceNote: one short sentence explaining the suggested price (material, size, condition)
- roomUse: array of applicable uses from: kitchen, bathroom, vanity, bar, outdoor, flooring, wall, fireplace, island
- aestheticTags: array from: veined, subtle, solid, sparkling, speckled, concrete, wood, bookmatched
- notes: brief visible details (veining, edges, condition) under 200 chars
If uncertain, omit fields rather than guessing dimensions or price.`;

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
}

function toStringArray(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item) => allowed.has(item));
}

export function parseAnalysisJson(raw: string): SlabImageAnalysis {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: SlabImageAnalysis = {};

    if (typeof parsed.name === "string" && parsed.name.trim()) {
      result.name = parsed.name.trim().slice(0, 120);
    }
    if (parsed.type === "full_slab" || parsed.type === "remnant") {
      result.type = parsed.type;
    }
    if (typeof parsed.material === "string" && parsed.material.trim()) {
      result.material = parsed.material.trim();
    }
    if (typeof parsed.finish === "string" && parsed.finish.trim()) {
      result.finish = parsed.finish.trim().toLowerCase();
    }
    if (typeof parsed.colorFamily === "string" && parsed.colorFamily.trim()) {
      result.colorFamily = parsed.colorFamily.trim().slice(0, 60);
    }
    if (typeof parsed.brandSupplier === "string" && parsed.brandSupplier.trim()) {
      result.brandSupplier = parsed.brandSupplier.trim().slice(0, 120);
    }
    if (typeof parsed.notes === "string" && parsed.notes.trim()) {
      result.notes = parsed.notes.trim().slice(0, 500);
    }
    if (typeof parsed.priceNote === "string" && parsed.priceNote.trim()) {
      result.priceNote = parsed.priceNote.trim().slice(0, 200);
    }

    const widthIn = toNumber(parsed.widthIn);
    const heightIn = toNumber(parsed.heightIn);
    const thicknessCm = toNumber(parsed.thicknessCm);
    const suggestedPriceUsd = toNumber(parsed.suggestedPriceUsd);

    if (widthIn !== undefined) result.widthIn = widthIn;
    if (heightIn !== undefined) result.heightIn = heightIn;
    if (thicknessCm !== undefined) result.thicknessCm = thicknessCm;
    if (suggestedPriceUsd !== undefined) {
      result.suggestedPriceUsd = Math.round(suggestedPriceUsd);
    }

    const roomUse = toStringArray(parsed.roomUse, ROOM_VALUES);
    if (roomUse.length > 0) result.roomUse = roomUse;

    const aestheticTags = toStringArray(parsed.aestheticTags, AESTHETIC_VALUES);
    if (aestheticTags.length > 0) result.aestheticTags = aestheticTags;

    return result;
  } catch {
    return {};
  }
}

async function analyzeWithOpenAI(imageUrl: string): Promise<SlabImageAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {};
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return parseAnalysisJson(content);
}

async function analyzeWithAnthropic(imageUrl: string): Promise<SlabImageAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {};
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_VISION_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: `${ANALYSIS_PROMPT}\nRespond with JSON only.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude vision failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    data.content?.find((block) => block.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return parseAnalysisJson(jsonMatch?.[0] ?? text);
}

export function isVisionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function analyzeSlabImage(
  imageUrl: string,
): Promise<{ analysis: SlabImageAnalysis; provider: "openai" | "anthropic" | null }> {
  if (process.env.OPENAI_API_KEY) {
    const analysis = await analyzeSlabImageWithFallback(imageUrl, analyzeWithOpenAI);
    return { analysis, provider: "openai" };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const analysis = await analyzeSlabImageWithFallback(imageUrl, analyzeWithAnthropic);
    return { analysis, provider: "anthropic" };
  }

  return { analysis: {}, provider: null };
}

async function analyzeSlabImageWithFallback(
  imageUrl: string,
  analyze: (url: string) => Promise<SlabImageAnalysis>,
): Promise<SlabImageAnalysis> {
  const analysis = await analyze(imageUrl);
  return enrichSuggestedPrice(analysis);
}

export function enrichSuggestedPrice(
  analysis: SlabImageAnalysis,
): SlabImageAnalysis {
  if (analysis.suggestedPriceUsd && analysis.suggestedPriceUsd > 0) {
    return analysis;
  }

  const sqft = computeSqft(analysis.widthIn, analysis.heightIn);
  const fallback = computeSuggestedPriceFallback(analysis, sqft);
  if (!fallback) {
    return analysis;
  }

  return {
    ...analysis,
    suggestedPriceUsd: fallback,
    priceNote:
      analysis.priceNote ??
      `Estimated from ${analysis.material ?? "stone"} ${analysis.type === "remnant" ? "remnant" : "slab"} size.`,
  };
}

export function computeSuggestedPriceFallback(
  analysis: SlabImageAnalysis,
  sqft: number | null,
): number | null {
  if (!sqft || sqft <= 0) {
    return analysis.type === "remnant" ? 149 : 399;
  }

  const material = (analysis.material ?? "").toLowerCase();
  let pricePerSqft = 28;

  if (material.includes("marble")) pricePerSqft = 42;
  else if (material.includes("quartzite")) pricePerSqft = 38;
  else if (material.includes("quartz")) pricePerSqft = 34;
  else if (material.includes("granite")) pricePerSqft = 30;
  else if (material.includes("dolomite")) pricePerSqft = 36;

  if (analysis.type === "remnant") {
    pricePerSqft *= 0.7;
  }

  return Math.max(49, Math.round(sqft * pricePerSqft));
}

export function matchMaterialId(
  materialName: string | undefined,
  materials: Array<{ id: string; name: string }>,
): string | undefined {
  if (!materialName) {
    return undefined;
  }

  const normalized = materialName.trim().toLowerCase();
  const exact = materials.find((m) => m.name.toLowerCase() === normalized);
  if (exact) {
    return exact.id;
  }

  const partial = materials.find((m) =>
    normalized.includes(m.name.toLowerCase()),
  );
  return partial?.id;
}
