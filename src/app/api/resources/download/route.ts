import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  categoryLabel,
  isOptOutConsent,
  normalizeResource,
  personalEmailMessage,
  publicConsents,
  publicQuestions,
  slugify,
  stepTwoFields,
} from "@/lib/resources";
import { setDownloadSubscription } from "@/lib/subscribers";
import type { ResourceItem } from "@/types/database";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const slug = typeof body.slug === "string" ? body.slug : "";
  const category = typeof body.category === "string" ? body.category : "";
  const personal = personalEmailMessage(email);
  if (!EMAIL_RE.test(email) || personal) {
    return NextResponse.json({ error: personal || "Enter a valid work email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .eq("category", category as ResourceItem["category"])
    .eq("status", "published")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "This download is not available" }, { status: 404 });

  const resource = normalizeResource(row as ResourceItem);
  const saveOnly = body.saveOnly === true;

  if (saveOnly) {
    const inserted = await insertDownload(admin, {
      resource_id: resource.id,
      email,
      fields: {},
      answers: {},
      profile_completed: false,
    });
    if (inserted.error || !inserted.id) {
      return NextResponse.json({ error: inserted.error || "Could not save download" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, saved: true, id: inserted.id, profileCompleted: false });
  }

  const consents = publicConsents(resource.form_config);
  const checked = Array.isArray(body.consents) ? body.consents.map(Boolean) : [];
  let optedOut = false;
  for (let i = 0; i < consents.length; i += 1) {
    const consent = consents[i];
    if (isOptOutConsent(consent)) {
      if (checked[i]) optedOut = true;
      continue;
    }
    if (consent.required !== false && !checked[i]) {
      return NextResponse.json({ error: "Tick the required consent boxes" }, { status: 400 });
    }
  }

  const incomingFields = asStringMap(body.fields);
  const incomingAnswers = asStringMap(body.answers);
  if (!incomingFields.first_name?.trim() || !incomingFields.last_name?.trim()) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
  }
  for (const field of stepTwoFields(resource.form_config)) {
    if (field.required && !incomingFields[field.key]?.trim()) {
      return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
    }
  }
  for (const question of publicQuestions(resource.form_config)) {
    if (!incomingAnswers[question.text]?.trim()) {
      return NextResponse.json({ error: "Answer each question" }, { status: 400 });
    }
  }

  try {
    await setDownloadSubscription(email, optedOut, {
      type: resource.category,
      slug: resource.slug,
      title: resource.title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const downloadId = typeof body.id === "string" ? body.id : "";
  const savedFields = {
    first_name: incomingFields.first_name.trim(),
    last_name: incomingFields.last_name.trim(),
    ...Object.fromEntries(
      stepTwoFields(resource.form_config).map((field) => [field.key, incomingFields[field.key]?.trim() ?? ""]),
    ),
  };

  if (downloadId) {
    const { data: existing, error: lookupError } = await admin
      .from("resource_downloads")
      .select("id, email, resource_id")
      .eq("id", downloadId)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
    if (!existing || existing.email !== email || existing.resource_id !== resource.id) {
      return NextResponse.json({ error: "Download session was not found" }, { status: 400 });
    }
    const updated = await updateDownload(admin, downloadId, {
      fields: savedFields,
      answers: incomingAnswers,
      profile_completed: true,
    });
    if (updated) return NextResponse.json({ error: updated }, { status: 500 });
  } else {
    const inserted = await insertDownload(admin, {
      resource_id: resource.id,
      email,
      fields: savedFields,
      answers: incomingAnswers,
      profile_completed: true,
    });
    if (inserted.error) return NextResponse.json({ error: inserted.error }, { status: 500 });
  }

  if (!resource.pdf_path) {
    return NextResponse.json({ error: "PDF is missing" }, { status: 404 });
  }
  const file = await admin.storage.from("resources").download(resource.pdf_path);
  if (file.error || !file.data) {
    return NextResponse.json({ error: file.error?.message ?? "Could not read PDF" }, { status: 500 });
  }
  const bytes = Buffer.from(await file.data.arrayBuffer());
  const filename = `${slugify(resource.title) || categoryLabel(resource.category)}.pdf`;
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function asStringMap(value: unknown) {
  const out: Record<string, string> = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") out[key] = item;
  }
  return out;
}

type DownloadWrite = {
  resource_id?: string;
  email?: string;
  fields: Record<string, string>;
  answers: Record<string, string>;
  profile_completed: boolean;
};

async function insertDownload(
  admin: ReturnType<typeof createAdminClient>,
  row: DownloadWrite & { resource_id: string; email: string },
) {
  const first = await admin.from("resource_downloads").insert(row).select("id").single();
  if (!first.error && first.data) return { id: first.data.id, error: "" };
  if (first.error && /profile_completed|column/i.test(first.error.message)) {
    const { profile_completed: _ignored, ...rest } = row;
    const retry = await admin.from("resource_downloads").insert(rest).select("id").single();
    if (!retry.error && retry.data) return { id: retry.data.id, error: "" };
    return { id: "", error: retry.error?.message ?? "Could not save download" };
  }
  return { id: "", error: first.error?.message ?? "Could not save download" };
}

async function updateDownload(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  row: Pick<DownloadWrite, "fields" | "answers" | "profile_completed">,
) {
  const first = await admin.from("resource_downloads").update(row).eq("id", id);
  if (!first.error) return "";
  if (/profile_completed|column/i.test(first.error.message)) {
    const { profile_completed: _ignored, ...rest } = row;
    const retry = await admin.from("resource_downloads").update(rest).eq("id", id);
    return retry.error?.message ?? "";
  }
  return first.error.message;
}
