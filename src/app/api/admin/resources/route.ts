import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  SITE_NAME,
  UPLOAD_CATEGORIES,
  VERTICALS,
  slugify,
} from "@/lib/resources";
import type {
  ResourceCategory,
  ResourceConsent,
  ResourceFormConfig,
  ResourceInsideSection,
} from "@/types/database";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(UPLOAD_CATEGORIES.map((item) => item.value));

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  }
  const form = await request.formData();
  const payload = parsePayload(form.get("payload"));
  if (!payload) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const title = payload.title.trim();
  const description = payload.description.trim();
  const category = payload.category;
  const vertical = VERTICALS.find((item) => item.slug === payload.verticalSlug);
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });
  if (description.length > 220) {
    return NextResponse.json({ error: "Description must be 220 characters or fewer" }, { status: 400 });
  }
  if (!CATEGORIES.has(category as Exclude<ResourceCategory, "guide">)) {
    return NextResponse.json({ error: "Choose a category" }, { status: 400 });
  }
  if (!vertical) return NextResponse.json({ error: "Choose a vertical" }, { status: 400 });

  const pdf = form.get("pdf");
  const cover = form.get("cover");
  const editing = Boolean(payload.id);
  let existingCover = "";
  let existingPdf = "";
  if (editing && payload.id) {
    const { data: existing } = await auth.admin!
      .from("resources")
      .select("cover_path, pdf_path")
      .eq("id", payload.id)
      .maybeSingle();
    existingCover = existing?.cover_path ?? "";
    existingPdf = existing?.pdf_path ?? "";
  }
  const hasPdf = (pdf instanceof File && pdf.size > 0) || Boolean(existingPdf);
  const hasCover = (cover instanceof File && cover.size > 0) || Boolean(existingCover);
  if (!hasPdf) return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  if (!hasCover) return NextResponse.json({ error: "Thumbnail is required" }, { status: 400 });
  if (pdf instanceof File && pdf.size > 0 && pdf.type && pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Upload a PDF file" }, { status: 400 });
  }

  const admin = auth.admin;
  const id = payload.id || crypto.randomUUID();
  let slug = slugify(payload.slug || title);
  slug = await uniqueSlug(admin, slug, payload.id);

  let pdfPath: string | null = null;
  let pdfUrl: string | null = null;
  if (pdf instanceof File && pdf.size > 0) {
    pdfPath = `pdfs/${id}.pdf`;
    const uploaded = await admin.storage.from("resources").upload(pdfPath, pdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploaded.error) {
      return NextResponse.json({ error: uploaded.error.message }, { status: 500 });
    }
    pdfUrl = admin.storage.from("resources").getPublicUrl(pdfPath).data.publicUrl;
  }

  let coverPath: string | null = null;
  let coverUrl: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    const ext = extension(cover.name) || "jpg";
    coverPath = `covers/${id}.${ext}`;
    const uploaded = await admin.storage.from("resources").upload(coverPath, cover, {
      contentType: cover.type || "image/jpeg",
      upsert: true,
    });
    if (uploaded.error) {
      return NextResponse.json({ error: uploaded.error.message }, { status: 500 });
    }
    coverUrl = admin.storage.from("resources").getPublicUrl(coverPath).data.publicUrl;
  }

  const categoryValue = category as Exclude<ResourceCategory, "guide">;
  const record = {
    title,
    description,
    category: categoryValue,
    vertical: vertical.label,
    vertical_slug: vertical.slug,
    slug,
    offered_by: payload.offeredBy.trim() || SITE_NAME,
    author_name: payload.author.trim() || null,
    meta_title: payload.metaTitle.trim() || null,
    meta_description: payload.metaDescription.trim() || null,
    keywords: payload.keywords.trim() || null,
    overview: payload.overview.trim() || null,
    inside_sections: payload.inside,
    form_config: payload.formConfig,
    status: "published" as const,
    updated_at: new Date().toISOString(),
  };

  if (payload.id) {
    const patch: Record<string, unknown> = { ...record };
    if (pdfPath) {
      patch.pdf_path = pdfPath;
      patch.pdf_url = pdfUrl;
    }
    if (coverPath) {
      patch.cover_path = coverPath;
      patch.cover_url = coverUrl;
    }
    const { error } = await admin.from("resources").update(patch as Partial<import("@/types/database").ResourceItem>).eq("id", payload.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: payload.id, slug });
  }

  const { error } = await admin.from("resources").insert({
    ...record,
    id,
    pdf_path: pdfPath,
    pdf_url: pdfUrl,
    cover_path: coverPath,
    cover_url: coverUrl,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, slug });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  }
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = auth.admin;
  const { data: row } = await admin
    .from("resources")
    .select("pdf_path, cover_path")
    .eq("id", id)
    .maybeSingle();
  const paths = [row?.pdf_path, row?.cover_path].filter((path): path is string => Boolean(path));
  if (paths.length) await admin.storage.from("resources").remove(paths);
  const { error } = await admin.from("resources").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function uniqueSlug(
  admin: Awaited<ReturnType<typeof requireAdminApi>>["admin"],
  slug: string,
  ignoreId?: string,
) {
  if (!admin) return slug;
  let candidate = slug;
  for (let n = 2; n < 50; n += 1) {
    const { data } = await admin.from("resources").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${slug}-${n}`;
  }
  return `${slug}-${Date.now()}`;
}

function extension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

type Payload = {
  id?: string;
  title: string;
  description: string;
  category: string;
  verticalSlug: string;
  slug: string;
  offeredBy: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  overview: string;
  inside: ResourceInsideSection[];
  formConfig: ResourceFormConfig;
};

function consentSlot(value: unknown, role: NonNullable<ResourceConsent["role"]>, required: boolean): ResourceConsent {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    role,
    text: typeof row.text === "string" ? row.text : "",
    required: role === "optOut" ? false : required,
    visible: row.visible !== false,
  };
}

function parsePayload(value: FormDataEntryValue | null): Payload | null {
  if (typeof value !== "string") return null;
  try {
    const data = JSON.parse(value) as Record<string, unknown>;
    const fields = Array.isArray(data.fields) ? data.fields : [];
    const explicitEmpty = data.fieldsExplicitlyEmpty === true && fields.length === 0;
    return {
      id: typeof data.id === "string" ? data.id : undefined,
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      category: String(data.category ?? ""),
      verticalSlug: String(data.verticalSlug ?? ""),
      slug: String(data.slug ?? ""),
      offeredBy: String(data.offeredBy ?? SITE_NAME),
      author: String(data.author ?? ""),
      metaTitle: String(data.metaTitle ?? ""),
      metaDescription: String(data.metaDescription ?? ""),
      keywords: String(data.keywords ?? ""),
      overview: String(data.overview ?? ""),
      inside: Array.isArray(data.inside) ? (data.inside as ResourceInsideSection[]) : [],
      formConfig: {
        fields: explicitEmpty ? [] : (fields as ResourceFormConfig["fields"]),
        fieldsExplicitlyEmpty: explicitEmpty,
        emailNote: String(data.emailNote ?? ""),
        footer: String(data.footer ?? ""),
        terms: consentSlot(data.terms, "terms", true),
        partners: consentSlot(data.partners, "partners", true),
        optOut: consentSlot(data.optOut, "optOut", false),
        extras: Array.isArray(data.extras)
          ? (data.extras as ResourceFormConfig["extras"])?.slice(0, 8).map((item) => ({
              ...item,
              role: "extra" as const,
            }))
          : [],
        questions: Array.isArray(data.questions) ? (data.questions as ResourceFormConfig["questions"]) : [],
      },
    };
  } catch {
    return null;
  }
}
