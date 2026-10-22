import type {
  ResourceCategory,
  ResourceConsent,
  ResourceField,
  ResourceFormConfig,
  ResourceInsideSection,
  ResourceItem,
  ResourceQuestion,
} from "@/types/database";

export const SITE_NAME = "CFOmatics";

export const VERTICALS = [
  { slug: "financial-reporting", label: "Financial Reporting" },
  { slug: "fpa", label: "FP&A" },
  { slug: "leadership", label: "Leadership" },
  { slug: "risk-compliance", label: "Risk & Compliance" },
  { slug: "tax", label: "Tax" },
  { slug: "technology", label: "Technology" },
  { slug: "treasury", label: "Treasury" },
] as const;

export type VerticalSlug = (typeof VERTICALS)[number]["slug"];

export const UPLOAD_CATEGORIES: {
  value: Exclude<ResourceCategory, "guide">;
  label: string;
}[] = [
  { value: "whitepaper", label: "White paper" },
  { value: "report", label: "Report" },
  { value: "case_study", label: "Case study" },
  { value: "webinar", label: "Webinar" },
];

export const RESOURCE_SECTIONS = [
  {
    n: "01",
    key: "blogs",
    label: "Blogs",
    href: "/blog",
    blurb: "Reporting and analysis from the CFOmatics newsroom.",
    pillars: ["Newsroom", "Analysis", "Briefings"],
  },
  {
    n: "02",
    key: "whitepapers",
    category: "whitepaper" as ResourceCategory,
    label: "White papers",
    href: "/resources/whitepapers?type=whitepaper",
    blurb: "Longer research for finance leaders who need the working detail.",
    pillars: ["In depth", "Practical", "Free"],
  },
  {
    n: "03",
    key: "reports",
    category: "report" as ResourceCategory,
    label: "Reports",
    href: "/resources/reports",
    blurb: "Benchmarks and findings from the CFOmatics research desk.",
    pillars: ["Benchmarks", "Findings", "Context"],
  },
  {
    n: "04",
    key: "case-studies",
    category: "case_study" as ResourceCategory,
    label: "Case studies",
    href: "/resources/case-studies",
    blurb: "How finance teams applied a change, and what it changed.",
    pillars: ["Practice", "Results", "Lessons"],
  },
  {
    n: "05",
    key: "guides",
    category: "guide" as ResourceCategory,
    label: "Guides",
    href: "/resources/guides",
    blurb: "Step-by-step guidance. Published guides appear here.",
    pillars: ["Steps", "Checklists", "Use"],
  },
  {
    n: "06",
    key: "webinars",
    category: "webinar" as ResourceCategory,
    label: "Webinars",
    href: "/resources/webinars",
    blurb: "Sessions and briefings you can watch or read on demand.",
    pillars: ["On demand", "Briefings", "Discussion"],
  },
] as const;

const SECTION_BY_KEY = Object.fromEntries(
  RESOURCE_SECTIONS.map((section) => [section.key, section]),
);

export function sectionByKey(key: string) {
  return SECTION_BY_KEY[key] ?? null;
}

export function leadLabel(type?: string | null, title?: string | null) {
  if (!type && !title) return "";
  const name = categoryLabel(type || "site");
  return title ? `${name} · ${title}` : name;
}

export function leadFromNote(raw?: string | null) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.kind !== "lead-source") return null;
    return {
      type: typeof data.type === "string" ? data.type : null,
      title: typeof data.title === "string" ? data.title : null,
      reason: typeof data.reason === "string" ? data.reason : null,
    };
  } catch {
    return null;
  }
}

export function categoryLabel(category: string) {
  if (category === "whitepaper") return "White paper";
  if (category === "report") return "Report";
  if (category === "case_study") return "Case study";
  if (category === "webinar") return "Webinar";
  if (category === "guide") return "Guide";
  if (category === "blog") return "Blog";
  if (category === "site") return "Site";
  return category;
}

export function verticalBySlug(slug: string) {
  return VERTICALS.find((item) => item.slug === slug) ?? null;
}

export function verticalLabel(slugOrLabel: string) {
  return (
    verticalBySlug(slugOrLabel)?.label ??
    VERTICALS.find((item) => item.label === slugOrLabel)?.label ??
    slugOrLabel
  );
}

export function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "resource";
}

export const FORM_FIELD_OPTIONS: ResourceField[] = [
  { label: "Zip/Postal Code", key: "zip", type: "text", required: true },
  { label: "Phone", key: "phone", type: "tel", required: true },
  { label: "First name", key: "first_name", type: "text", required: true },
  { label: "Last name", key: "last_name", type: "text", required: true },
  { label: "Job title", key: "job_title", type: "text", required: true },
  { label: "Street address", key: "street", type: "text", required: true },
  { label: "Suite / office", key: "suite", type: "text", required: true },
  { label: "City", key: "city", type: "text", required: true },
  { label: "State / province", key: "state", type: "text", required: true },
  { label: "Country", key: "country", type: "text", required: true },
];

export const DEFAULT_FIELDS: ResourceField[] = FORM_FIELD_OPTIONS.filter(
  (field) => field.key === "zip" || field.key === "phone",
).map((field) => ({ ...field, required: true }));

export const DEFAULT_EMAIL_NOTE =
  "Company email only. Not Gmail, Yahoo, Outlook, or other personal addresses.";

export const DEFAULT_TERMS: ResourceConsent = {
  role: "terms",
  required: true,
  visible: true,
  text: `I agree to ${SITE_NAME}'s {{terms}}, {{privacy}}, and the transfer of my information to the United States for processing to provide me with relevant information as described in our {{privacy}}.`,
};

export const DEFAULT_PARTNERS: ResourceConsent = {
  role: "partners",
  required: true,
  visible: true,
  text: `I agree to my information being processed by ${SITE_NAME} and its partners to contact me via phone, email or other means regarding information relevant to my professional interests. I may {{unsubscribe}} at any time.`,
};

export const DEFAULT_OPT_OUT: ResourceConsent = {
  role: "optOut",
  required: false,
  visible: true,
  text: `**Optional:** check this box only if you want to **opt out of further emails** from ${SITE_NAME}. Leave it unchecked to keep receiving relevant updates. Read our {{privacy-statement}}.`,
};

export const DEFAULT_FOOTER = "I have read and understood privacy statement of {{publisher}}.";

export const DEFAULT_CONSENTS: ResourceConsent[] = [
  { ...DEFAULT_TERMS },
  { ...DEFAULT_PARTNERS },
  { ...DEFAULT_OPT_OUT },
];

const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "yahoo.ca",
  "yahoo.com.au",
  "yahoo.fr",
  "yahoo.de",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "mail.com",
  "email.com",
  "inbox.com",
  "yandex.com",
  "yandex.ru",
  "qq.com",
  "163.com",
  "rediffmail.com",
]);

export function personalEmailMessage(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return "Enter a valid work email";
  const personal =
    PERSONAL_DOMAINS.has(domain) ||
    /^(gmail|googlemail|yahoo|ymail|rocketmail|outlook|hotmail|live|msn|icloud)\./.test(domain);
  if (!personal) return "";
  return "Use a company email. Not Gmail, Yahoo, Outlook, Hotmail, iCloud, or other personal addresses.";
}

export type ConsentPart =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; label: string; href: string };

const TOKEN_LINKS: Record<string, { label: string; href: string }> = {
  terms: { label: "Terms of Use", href: "/about#standards" },
  privacy: { label: "Privacy Policy", href: "/privacy" },
  "privacy-statement": { label: "privacy statement", href: "/privacy" },
  unsubscribe: { label: "unsubscribe", href: "/unsubscribe" },
  publisher: { label: SITE_NAME, href: "/" },
};

export function parseConsentText(input: string): ConsentPart[] {
  const re =
    /\*\*([^*]+)\*\*|\{\{(terms|privacy-statement|privacy|unsubscribe|publisher)\}\}|(?<!\{)\{(terms|privacy-statement|privacy|unsubscribe|publisher)\}|\[([^\]]+)\]\(([^)]+)\)|\{([^}|]+)\|([^}]+)\}|\{Privacy Policy\}/g;
  const parts: ConsentPart[] = [];
  let cursor = 0;
  for (const match of input.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "text", value: input.slice(cursor, index) });
    if (match[1]) {
      parts.push({ type: "bold", value: match[1] });
    } else if (match[2] && TOKEN_LINKS[match[2]]) {
      parts.push({ type: "link", ...TOKEN_LINKS[match[2]] });
    } else if (match[3] && TOKEN_LINKS[match[3]]) {
      parts.push({ type: "link", ...TOKEN_LINKS[match[3]] });
    } else if (match[0] === "{Privacy Policy}") {
      parts.push({ type: "link", label: "Privacy Policy", href: "/privacy" });
    } else if (match[4] && match[5]) {
      parts.push({ type: "link", label: match[4], href: match[5] });
    } else if (match[6] && match[7]) {
      parts.push({ type: "link", label: match[6], href: match[7] });
    }
    cursor = index + match[0].length;
  }
  if (cursor < input.length) parts.push({ type: "text", value: input.slice(cursor) });
  return parts.length ? parts : [{ type: "text", value: input }];
}

export function isOptOutConsent(consent: ResourceConsent) {
  if (consent.role === "optOut") return true;
  if (consent.role) return false;
  return /opt out of further emails|\bopt out\b/i.test(consent.text);
}

export function catalogField(key: string) {
  return FORM_FIELD_OPTIONS.find((item) => item.key === key) ?? null;
}

export function publicFields(config: ResourceFormConfig | null | undefined) {
  const fields = catalogFields(config?.fields);
  if (fields.length > 0) return fields;
  if (config?.fieldsExplicitlyEmpty) return [];
  return DEFAULT_FIELDS.map((field) => ({ ...field }));
}

/** Admin fields for step 2, without a second First name or Last name. */
export function stepTwoFields(config: ResourceFormConfig | null | undefined) {
  return publicFields(config).filter((field) => field.key !== "first_name" && field.key !== "last_name");
}

export function emailNoteText(config: ResourceFormConfig | null | undefined) {
  return config?.emailNote?.trim() || DEFAULT_EMAIL_NOTE;
}

export function footerText(config: ResourceFormConfig | null | undefined) {
  return config?.footer?.trim() || DEFAULT_FOOTER;
}

export function publicConsents(config: ResourceFormConfig | null | undefined) {
  const slots = [config?.terms, config?.partners, config?.optOut].filter(
    (item): item is ResourceConsent => Boolean(item?.text?.trim()),
  );
  const base = slots.length > 0 ? slots : DEFAULT_CONSENTS.map((item) => ({ ...item }));
  const extras = (config?.extras ?? []).slice(0, 8).map((item) => ({ ...item, role: "extra" as const }));
  return [...base, ...extras].filter((item) => item.visible !== false && item.text.trim());
}

export function publicQuestions(config: ResourceFormConfig | null | undefined) {
  const questions = Array.isArray(config?.questions) ? config.questions : [];
  return questions.filter((question) => question.text.trim());
}

export function detailPath(category: string, slug: string) {
  const section = RESOURCE_SECTIONS.find(
    (item) => "category" in item && item.category === category,
  );
  return section ? `/resources/${section.key}/${slug}` : `/resources/${slug}`;
}

export function downloadPath(category: string, slug: string) {
  const section = RESOURCE_SECTIONS.find(
    (item) => "category" in item && item.category === category,
  );
  return section ? `/download/${section.key}/${slug}` : `/download/${slug}`;
}

function catalogFields(value: ResourceField[] | undefined) {
  const used = new Set<string>();
  const fields: ResourceField[] = [];
  for (const field of value ?? []) {
    const option = catalogField(field.key);
    if (!option || used.has(option.key)) continue;
    used.add(option.key);
    fields.push({ ...option, required: field.required !== false });
    if (fields.length >= 12) break;
  }
  return fields;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asFields(value: unknown): ResourceField[] {
  if (!Array.isArray(value)) return [];
  return catalogFields(
    value.flatMap((item) => {
      const row = asRecord(item);
      const key = typeof row.key === "string" ? row.key : "";
      const option = catalogField(key);
      if (!option) return [];
      return [{ ...option, required: row.required !== false }];
    }),
  );
}

function asConsent(value: unknown, role: NonNullable<ResourceConsent["role"]>, fallback: ResourceConsent): ResourceConsent {
  const row = asRecord(value);
  const text = typeof row.text === "string" ? row.text : "";
  if (!text.trim()) return { ...fallback, role };
  return {
    role,
    text,
    required: role === "optOut" ? false : role === "extra" ? row.required === true : true,
    visible: row.visible !== false,
  };
}

function asConsents(value: unknown): ResourceConsent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    const text = typeof row.text === "string" ? row.text : "";
    if (!text.trim()) return [];
    const role = row.role === "terms" || row.role === "partners" || row.role === "optOut" || row.role === "extra"
      ? row.role
      : undefined;
    return [
      {
        text,
        role,
        required: row.required !== false,
        visible: row.visible !== false,
      },
    ];
  });
}

function asQuestions(value: unknown): ResourceQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    const text = typeof row.text === "string" ? row.text : "";
    if (!text.trim()) return [];
    const options = Array.isArray(row.options)
      ? row.options.filter((option): option is string => typeof option === "string" && option.trim() !== "")
      : [];
    return [{ text, options }];
  });
}

function asSections(value: unknown): ResourceInsideSection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    const heading = typeof row.heading === "string" ? row.heading : "";
    const body = typeof row.body === "string" ? row.body : "";
    if (!heading && !body) return [];
    return [{ heading, body }];
  });
}

export function normalizeResource(row: ResourceItem): ResourceItem {
  const config = asRecord(row.form_config);
  const legacy = asConsents(config.consents);
  const legacyOptOut = legacy.find((item) => isOptOutConsent(item));
  const legacyRequired = legacy.filter((item) => !isOptOutConsent(item));
  return {
    ...row,
    inside_sections: asSections(row.inside_sections),
    form_config: {
      fields: asFields(config.fields),
      fieldsExplicitlyEmpty: config.fieldsExplicitlyEmpty === true,
      emailNote: typeof config.emailNote === "string" ? config.emailNote : "",
      terms: asConsent(config.terms ?? legacyRequired[0], "terms", DEFAULT_TERMS),
      partners: asConsent(config.partners ?? legacyRequired[1], "partners", DEFAULT_PARTNERS),
      optOut: asConsent(config.optOut ?? legacyOptOut, "optOut", DEFAULT_OPT_OUT),
      footer: typeof config.footer === "string" ? config.footer : "",
      extras: asConsents(config.extras).slice(0, 8).map((item) => ({ ...item, role: "extra" as const, required: item.required === true })),
      questions: asQuestions(config.questions),
    },
  };
}

