import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  analyzeSlabImage,
  isVisionConfigured,
} from "@/lib/ai/slab-analysis";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  return NextResponse.json({
    configured: isVisionConfigured(),
    signedIn: Boolean(userId),
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!isVisionConfigured()) {
    return NextResponse.json(
      {
        error:
          "Vision AI is not configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY.",
        configured: false,
      },
      { status: 503 },
    );
  }

  let imageUrl: string;
  try {
    const body = (await request.json()) as { imageUrl?: string };
    if (!body.imageUrl) {
      return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
    }
    imageUrl = new URL(body.imageUrl).toString();
  } catch {
    return NextResponse.json({ error: "Invalid imageUrl." }, { status: 400 });
  }

  try {
    const { analysis, provider } = await analyzeSlabImage(imageUrl);
    return NextResponse.json({ analysis, provider, configured: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not analyze image.",
      },
      { status: 502 },
    );
  }
}
