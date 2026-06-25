import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Approximate location from the edge, used as a fallback before (or instead of)
 * asking for precise browser geolocation.
 *
 * Note: in Next.js 16 the old `request.geo` object no longer exists. On Vercel,
 * the edge runtime injects `x-vercel-ip-*` headers instead, which is what we
 * read here. Locally these headers are absent, so we return nulls and the UI
 * falls back to asking the buyer for precise location.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const headers = request.headers;

  const decode = (value: string | null) => {
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const toNumber = (value: string | null) => {
    if (!value) return null;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return NextResponse.json({
    city: decode(headers.get("x-vercel-ip-city")),
    region: headers.get("x-vercel-ip-country-region"),
    country: headers.get("x-vercel-ip-country") ?? "US",
    lat: toNumber(headers.get("x-vercel-ip-latitude")),
    lng: toNumber(headers.get("x-vercel-ip-longitude")),
  });
}
