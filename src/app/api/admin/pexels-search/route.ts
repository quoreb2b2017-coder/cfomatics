import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface PexelsPhoto {
  id: number;
  src: { large2x: string; large: string; medium: string };
  photographer: string;
  photographer_url: string;
  alt: string | null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ photos: [] });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "PEXELS_API_KEY not set" }, { status: 500 });
  }

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "12");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Pexels error ${res.status}` },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { photos: PexelsPhoto[] };
  const photos = data.photos.map((p) => ({
    id: p.id,
    thumbUrl: p.src.medium,
    fullUrl: p.src.large2x ?? p.src.large,
    alt: p.alt ?? query,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
  }));

  return NextResponse.json({ photos });
}
