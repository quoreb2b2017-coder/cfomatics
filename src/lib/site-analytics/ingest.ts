import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  pseudonymizeIp,
  resolveClientIp,
  resolveGeo,
} from "@/lib/site-analytics/ip";
import {
  pruneRateLimitBuckets,
  rateLimit,
} from "@/lib/site-analytics/rate-limit";
import {
  deriveConsentStatus,
  isValidKind,
  isValidSessionId,
  sanitizeCustomMeta,
  sanitizeMarketingMeta,
  sanitizePath,
  sanitizeReferrer,
  sanitizeString,
} from "@/lib/site-analytics/sanitize";

export type IngestResult =
  | { ok: true; id?: string }
  | { ok: false; status: number; detail: string };

export async function ingestSiteAnalyticsEvent(
  request: Request,
  body: Record<string, unknown>,
): Promise<IngestResult> {
  pruneRateLimitBuckets();

  const ip = resolveClientIp(request);
  const rateKey = `analytics:${ip || "unknown"}`;
  const limited = rateLimit(rateKey, { limit: 90, windowMs: 60_000 });
  if (!limited.ok) {
    return { ok: false, status: 429, detail: "Rate limit exceeded" };
  }

  const kind = body.kind;
  if (!isValidKind(kind)) {
    return { ok: false, status: 400, detail: "Invalid kind" };
  }

  const sessionId = body.sessionId;
  if (!isValidSessionId(sessionId)) {
    return { ok: false, status: 400, detail: "Invalid sessionId" };
  }

  const consentIn =
    body.consent && typeof body.consent === "object"
      ? (body.consent as Record<string, unknown>)
      : {};
  const analytics = !!consentIn.analytics;
  const marketing = !!consentIn.marketing;

  if ((kind === "page_view" || kind === "custom") && !analytics) {
    return { ok: false, status: 403, detail: "Analytics consent required" };
  }

  const path = sanitizePath(body.path);
  const referrer = sanitizeReferrer(body.referrer);
  const userAgent = sanitizeString(request.headers.get("user-agent") || "", 400);
  const geo = resolveGeo(request);
  const pseudoIp = pseudonymizeIp(ip);
  const consentStatus = deriveConsentStatus(analytics, marketing);

  const marketingMeta = sanitizeMarketingMeta(body.marketing);
  if (geo.country) marketingMeta.country = geo.country;
  if (geo.city) marketingMeta.city = geo.city;
  if (geo.region) marketingMeta.region = geo.region;
  if (pseudoIp) marketingMeta.pseudonymizedIp = pseudoIp;

  const consentSnapshot = {
    necessary: true,
    analytics,
    marketing,
    consentId:
      sanitizeString(marketingMeta.consentId || body.consentId, 80) ||
      undefined,
    consentStatus,
    consentedDomain: sanitizeString(
      body.consentedDomain ||
        request.headers.get("host") ||
        "www.cfomatics.com",
      120,
    ),
    pseudonymizedIp: pseudoIp,
    choice: sanitizeString(marketingMeta.choice, 40) || undefined,
  };

  const customMeta =
    kind === "custom"
      ? sanitizeCustomMeta(body.customMeta || body.custom)
      : {};

  const db = createAdminClient();
  const row = {
    kind,
    session_id: sessionId,
    path,
    referrer: referrer || null,
    user_agent: userAgent || null,
    consent_snapshot: consentSnapshot,
    marketing_meta: marketingMeta,
    custom_meta: customMeta,
  };

  const { data, error } = await db
    .from("site_analytics_events")
    .insert(row)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[site-analytics] insert failed:", error.message);
    return { ok: false, status: 503, detail: error.message };
  }

  if (kind === "consent") {
    const choice =
      consentSnapshot.choice === "accept_all" ||
      consentSnapshot.choice === "reject_all" ||
      consentSnapshot.choice === "custom"
        ? consentSnapshot.choice
        : analytics && marketing
          ? "accept_all"
          : !analytics && !marketing
            ? "reject_all"
            : "custom";

    const { error: consentError } = await db.from("consent_events").insert({
      choice,
      necessary: true,
      analytics,
      marketing,
      consent_version: 1,
      session_id: sessionId,
      path,
      pseudonymized_ip: pseudoIp,
      consent_status: consentStatus,
      country: geo.country || null,
    });
    if (consentError) {
      console.warn("[consent_events] dual-write failed:", consentError.message);
    }
  }

  return { ok: true, id: data?.id };
}
