/** Sanitize / validate site analytics payloads. */

const SESSION_RE = /^[a-zA-Z0-9_-]{12,64}$/;
const KINDS = new Set(["page_view", "consent", "custom"]);

export function isValidSessionId(id: unknown): id is string {
  return typeof id === "string" && SESSION_RE.test(id);
}

export function isValidKind(
  kind: unknown,
): kind is "page_view" | "consent" | "custom" {
  return typeof kind === "string" && KINDS.has(kind);
}

export function sanitizePath(raw: unknown): string {
  const s = String(raw || "/").slice(0, 500);
  if (!s.startsWith("/")) return `/${s}`.slice(0, 500);
  return s.replace(/[<>\u0000-\u001F]/g, "");
}

export function sanitizeReferrer(raw: unknown): string {
  return String(raw || "")
    .slice(0, 500)
    .replace(/[<>\u0000-\u001F]/g, "");
}

export function sanitizeString(raw: unknown, max = 200): string {
  return String(raw ?? "")
    .trim()
    .slice(0, max)
    .replace(/[<>\u0000-\u001F]/g, "");
}

/** Never store full emails — domain only. */
export function extractEmailDomain(raw: unknown): {
  hint: boolean;
  domain: string;
} {
  const s = String(raw || "");
  const match = s.match(
    /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  );
  if (!match) return { hint: false, domain: "" };
  return { hint: true, domain: match[1]!.toLowerCase().slice(0, 120) };
}

export function scrubEmailFromText(raw: unknown, max = 500): string {
  return String(raw || "")
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[email]",
    )
    .slice(0, max);
}

export function deriveConsentStatus(
  analytics: boolean,
  marketing: boolean,
): string {
  if (analytics && marketing) return "all";
  if (analytics && !marketing) return "analytics_only";
  if (!analytics && marketing) return "marketing_only";
  return "necessary_only";
}

export function sanitizeMarketingMeta(
  input: unknown,
): Record<string, unknown> {
  const src =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const out: Record<string, unknown> = {};

  const copyKeys = [
    "locale",
    "deviceCategory",
    "viewportWidth",
    "viewportBucket",
    "screenWidth",
    "screenHeight",
    "pixelRatio",
    "platform",
    "primaryLanguage",
    "languagesLabel",
    "timeZone",
    "connectionEffectiveType",
    "connectionDownlink",
    "referrerHost",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmContent",
    "utmTerm",
    "ftSource",
    "ftMedium",
    "ftCampaign",
    "ftContent",
    "ftTerm",
    "ftLandingPath",
    "ftAt",
    "emailPrefillDomain",
    "choice",
    "consentId",
  ] as const;

  for (const key of copyKeys) {
    if (src[key] === undefined || src[key] === null || src[key] === "")
      continue;
    if (typeof src[key] === "number") {
      out[key] = src[key];
    } else if (typeof src[key] === "boolean") {
      out[key] = src[key];
    } else {
      out[key] = sanitizeString(
        src[key],
        key.startsWith("ft") || key.includes("Path") ? 300 : 120,
      );
    }
  }

  if (typeof src.emailPrefillHint === "boolean")
    out.emailPrefillHint = src.emailPrefillHint;

  if (
    typeof out.emailPrefillDomain === "string" &&
    out.emailPrefillDomain.includes("@")
  ) {
    const { hint, domain } = extractEmailDomain(out.emailPrefillDomain);
    out.emailPrefillHint = hint;
    out.emailPrefillDomain = domain;
  }

  return out;
}

export function sanitizeCustomMeta(input: unknown): Record<string, unknown> {
  const src =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src).slice(0, 20)) {
    const key = sanitizeString(k, 40);
    if (!key) continue;
    if (typeof v === "number" || typeof v === "boolean") out[key] = v;
    else out[key] = scrubEmailFromText(v, 200);
  }
  return out;
}
