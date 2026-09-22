/** Client IP resolution + GDPR-friendly pseudonymization. */

const PRIVATE_V4 =
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.|169\.254\.)/;

export function resolveClientIp(request: Request): string | null {
  const headers = request.headers;
  const candidates = [
    headers.get("x-forwarded-for"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("forwarded"),
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-client-ip"),
    headers.get("true-client-ip"),
    headers.get("fastly-client-ip"),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const first = extractIp(raw);
    if (first) return first;
  }
  return null;
}

function extractIp(raw: string): string | null {
  const forwarded = raw.match(/for=(?:"?\[?)([^\]";,\s]+)/i);
  const value = forwarded ? forwarded[1]! : raw.split(",")[0]!.trim();
  return sanitizeIp(value);
}

export function sanitizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = String(raw).trim().replace(/^\[|\]$/g, "");

  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.replace(/:\d+$/, "");
  }

  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  if (isValidIpv4(ip) || isValidIpv6(ip)) return ip;
  return null;
}

function isValidIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function isValidIpv6(ip: string): boolean {
  return /^[0-9a-f:]+$/i.test(ip) && ip.includes(":");
}

export function isPrivateOrLocal(ip: string | null): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "localhost") return true;
  if (isValidIpv4(ip) && PRIVATE_V4.test(ip)) return true;
  return false;
}

/** IPv4 → a.b.c.0 ; IPv6 → keep first 4 hextets, zero rest */
export function pseudonymizeIp(ip: string | null): string | null {
  if (!ip) return null;
  if (isValidIpv4(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (isValidIpv6(ip)) {
    const expanded = expandIpv6(ip);
    if (!expanded) return null;
    const hextets = expanded.split(":");
    return `${hextets.slice(0, 4).join(":")}::`;
  }
  return null;
}

function expandIpv6(ip: string): string | null {
  if (!ip.includes("::")) {
    const parts = ip.split(":");
    return parts.length === 8
      ? parts.map((h) => h.padStart(4, "0")).join(":")
      : null;
  }
  const [left, right] = ip.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const missing = 8 - leftParts.length - rightParts.length;
  if (missing < 0) return null;
  const mid = Array(missing).fill("0000");
  return [...leftParts, ...mid, ...rightParts]
    .map((h) => h.padStart(4, "0"))
    .join(":");
}

export function resolveGeo(request: Request): {
  country?: string;
  city?: string;
  region?: string;
} {
  const h = request.headers;
  const country =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    undefined;
  const city = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || undefined;
  const region =
    h.get("x-vercel-ip-country-region") ||
    h.get("x-vercel-ip-region") ||
    h.get("cf-region") ||
    undefined;

  return {
    country: country ? decodeURIComponent(country).slice(0, 80) : undefined,
    city: city ? decodeURIComponent(city).slice(0, 120) : undefined,
    region: region ? decodeURIComponent(region).slice(0, 120) : undefined,
  };
}
