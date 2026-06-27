export type SlabImageAnalysis = {
  name?: string;
  type?: "full_slab" | "remnant";
  material?: string;
  finish?: string;
  colorFamily?: string;
  notes?: string;
};

const ANALYSIS_PROMPT = `You analyze photos of stone slabs and remnants for a marketplace listing.
Return JSON only with these optional string fields:
- name: short listing title (e.g. "Calacatta Gold Quartz Remnant")
- type: "full_slab" or "remnant"
- material: one of Granite, Quartz, Quartzite, Marble, Dolomite, Other
- finish: one of polished, honed, leathered, brushed, sandblasted, other
- colorFamily: short color description (e.g. white, gray, beige)
- notes: brief visible details (veining, edges, condition) under 200 chars
If uncertain, omit fields rather than guessing.`;

function parseAnalysisJson(raw: string): SlabImageAnalysis {
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
    if (typeof parsed.notes === "string" && parsed.notes.trim()) {
      result.notes = parsed.notes.trim().slice(0, 500);
    }

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
      max_tokens: 400,
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
      max_tokens: 400,
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
    const analysis = await analyzeWithOpenAI(imageUrl);
    return { analysis, provider: "openai" };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const analysis = await analyzeWithAnthropic(imageUrl);
    return { analysis, provider: "anthropic" };
  }

  return { analysis: {}, provider: null };
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
