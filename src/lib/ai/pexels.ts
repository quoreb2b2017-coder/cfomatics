import "server-only";

export interface PexelsPick {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  photoId: number;
}

interface PexelsPhoto {
  id: number;
  src: { large2x: string; large: string };
  photographer: string;
  photographer_url: string;
  alt: string | null;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

/** Extract a stable photo id from a Pexels CDN URL when possible. */
export function pexelsPhotoKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/photos\/(\d+)\//);
  if (m) return m[1];
  // Fall back to path without query so size/variant params don't create duplicates.
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function toPick(photo: PexelsPhoto, fallbackAlt: string): PexelsPick {
  return {
    url: photo.src.large2x ?? photo.src.large,
    alt: photo.alt ?? fallbackAlt,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    photoId: photo.id,
  };
}

/**
 * Search Pexels and return a photo that is not in `excludeKeys`
 * (photo ids / normalized URLs already used by other articles).
 */
export async function searchPexelsPhoto(
  query: string,
  options?: {
    excludeKeys?: Iterable<string>;
    /** Prefer a different page so similar queries diverge. */
    pageSalt?: string;
  },
): Promise<PexelsPick | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not set");
  }

  const excluded = new Set(
    [...(options?.excludeKeys ?? [])].map(String).filter(Boolean),
  );

  // Derive a page offset from salt so two articles with similar queries
  // don't always land on photo #1.
  let page = 1;
  if (options?.pageSalt) {
    let h = 0;
    for (let i = 0; i < options.pageSalt.length; i++) {
      h = (h * 31 + options.pageSalt.charCodeAt(i)) >>> 0;
    }
    page = (h % 5) + 1;
  }

  const tryPages = [page, 1, 2, 3].filter(
    (p, i, arr) => arr.indexOf(p) === i,
  );

  for (const p of tryPages) {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "15");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("page", String(p));

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Pexels search failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as PexelsSearchResponse;
    for (const photo of data.photos ?? []) {
      const key = String(photo.id);
      const pick = toPick(photo, query);
      const urlKey = pexelsPhotoKey(pick.url);
      if (excluded.has(key) || (urlKey && excluded.has(urlKey))) continue;
      return pick;
    }
  }

  // Last resort: broaden the query and try once more.
  const broad = query.split(/\s+/).slice(0, 2).join(" ") || "finance office";
  if (broad !== query) {
    return searchPexelsPhoto(broad, {
      excludeKeys: excluded,
      pageSalt: `${options?.pageSalt ?? ""}-broad`,
    });
  }

  return null;
}
