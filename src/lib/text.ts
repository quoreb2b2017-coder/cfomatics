/**
 * House style: use a plain hyphen "-" instead of em/en dashes.
 * Apply on write (AI + admin) and on read so existing content stays consistent.
 */

const DASH_RE = /[\u2014\u2013\u2015\u2212\u2012]/g; // em, en, horizontal bar, minus, figure dash
const DASH_ENTITY_RE = /&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;/gi;

export function normalizeDashes(input: string): string {
  return input.replace(DASH_ENTITY_RE, "-").replace(DASH_RE, "-");
}

export function normalizeDashesDeep<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeDashes(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDashesDeep(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeDashesDeep(v);
    }
    return out as T;
  }
  return value;
}
