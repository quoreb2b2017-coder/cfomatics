import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMailer, isMailConfigured, mailFrom } from "@/lib/email";
import { getSiteUrl } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeInput = {
  email: string;
  source?: string;
  articleId?: string | null;
  articleSlug?: string | null;
  articleTitle?: string | null;
  topicId?: string | null;
  topicSlug?: string | null;
  topicName?: string | null;
  sourceType?: string | null;
  sourceSlug?: string | null;
  sourceTitle?: string | null;
};

export const ALREADY_SUBSCRIBED =
  "This email is already subscribed. Enter a new email.";

type LeadSource = {
  type: string | null;
  slug: string | null;
  title: string | null;
  reason?: string | null;
};

function parseLeadNote(raw: string | null | undefined): LeadSource | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.kind !== "lead-source") return null;
    return {
      type: typeof data.type === "string" ? data.type : null,
      slug: typeof data.slug === "string" ? data.slug : null,
      title: typeof data.title === "string" ? data.title : null,
      reason: typeof data.reason === "string" ? data.reason : null,
    };
  } catch {
    return null;
  }
}

function leadNote(source: LeadSource) {
  return JSON.stringify({
    kind: "lead-source",
    type: source.type,
    slug: source.slug,
    title: source.title,
    reason: source.reason ?? null,
  });
}

async function writeLeadSource(
  admin: ReturnType<typeof createAdminClient>,
  subscriberId: string,
  source: LeadSource,
) {
  const { error } = await admin
    .from("subscribers")
    .update({
      source_type: source.type,
      source_slug: source.slug,
      source_title: source.title,
    })
    .eq("id", subscriberId);

  if (!error) return;
  if (!/source_type|source_slug|source_title|column/i.test(error.message)) {
    throw new Error(error.message);
  }

  const { data } = await admin
    .from("subscribers")
    .select("unsubscribe_reason")
    .eq("id", subscriberId)
    .maybeSingle();
  const previous = parseLeadNote(data?.unsubscribe_reason);
  const { error: noteError } = await admin
    .from("subscribers")
    .update({
      unsubscribe_reason: leadNote({
        ...source,
        reason: previous?.reason ?? null,
      }),
    })
    .eq("id", subscriberId);
  if (noteError) throw new Error(noteError.message);
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function saveSubscriber(input: SubscribeInput) {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new Error("Enter a valid work email");
  }

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("subscribers")
    .select("id, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  let subscriberId = existing?.id;
  if (!subscriberId) {
    const { data: inserted, error: insertError } = await admin
      .from("subscribers")
      .insert({ email })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Could not save subscriber");
    }
    subscriberId = inserted.id;
  } else if (!existing?.unsubscribed_at) {
    throw new Error(ALREADY_SUBSCRIBED);
  } else {
    const { error } = await admin
      .from("subscribers")
      .update({ unsubscribed_at: null })
      .eq("id", subscriberId);
    if (error) throw new Error(error.message);
  }

  await writeLeadSource(admin, subscriberId, {
    type: input.sourceType || input.source || "site",
    slug: input.sourceSlug || input.articleSlug || input.topicSlug || null,
    title: input.sourceTitle || input.articleTitle || input.topicName || null,
  });

  const articleId = input.articleId || null;
  const topicId = input.topicId || null;
  const { error: interestError } = await admin.from("subscriber_interests").insert({
    subscriber_id: subscriberId,
    article_id: articleId,
    article_slug: input.articleSlug || null,
    article_title: input.articleTitle || null,
    topic_id: topicId,
    topic_slug: input.topicSlug || null,
    topic_name: input.topicName || null,
    source: input.source || "site",
  });

  if (interestError && interestError.code !== "23505") {
    throw new Error(interestError.message);
  }

  return { id: subscriberId, email };
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", trimmed)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("unsubscribe failed:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function unsubscribeByEmail(
  emailRaw: string,
  reason?: string | null,
): Promise<{ found: boolean }> {
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new Error("Enter a valid work email");
  }

  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("subscribers")
    .select("id, unsubscribe_reason")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existing) {
    const typedNew = reason?.trim().slice(0, 280) || null;
    const inserted = await admin.from("subscribers").insert({
      email,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: typedNew,
      source_type: "site",
      source_title: "Unsubscribe",
    });
    if (inserted.error && /source_type|source_title|unsubscribe_reason|column/i.test(inserted.error.message)) {
      const retry = await admin.from("subscribers").insert({
        email,
        unsubscribed_at: new Date().toISOString(),
      });
      if (retry.error) throw new Error(retry.error.message);
    } else if (inserted.error) {
      throw new Error(inserted.error.message);
    }
    return { found: true };
  }

  const typed = reason?.trim().slice(0, 280) || null;
  const previous = parseLeadNote(existing.unsubscribe_reason);
  const patch: { unsubscribed_at: string; unsubscribe_reason?: string | null } =
    {
      unsubscribed_at: new Date().toISOString(),
    };
  if (previous) {
    patch.unsubscribe_reason = leadNote({ ...previous, reason: typed });
  } else if (typed) {
    patch.unsubscribe_reason = typed;
  }

  const { error } = await admin
    .from("subscribers")
    .update(patch)
    .eq("id", existing.id);

  if (error) {
    // Column may not exist yet on older DBs — retry without reason.
    if (reason && /unsubscribe_reason|column/i.test(error.message)) {
      const { error: retryError } = await admin
        .from("subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (retryError) throw new Error(retryError.message);
      return { found: true };
    }
    throw new Error(error.message);
  }

  return { found: true };
}

/** Step 2 marketing consent. A checked opt-out unsubscribes. An unchecked box keeps mail on. */
export async function setDownloadSubscription(
  emailRaw: string,
  optedOut: boolean,
  source: { type: string; slug: string | null; title: string | null },
) {
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email) || email.length > 254) return;
  const admin = createAdminClient();
  const { data: existing, error } = await admin
    .from("subscribers")
    .select("id, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const unsubscribedAt = optedOut ? new Date().toISOString() : null;

  if (!existing) {
    const { data: inserted, error: insertError } = await admin
      .from("subscribers")
      .insert({
        email,
        unsubscribed_at: unsubscribedAt,
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Could not save email");
    }
    await writeLeadSource(admin, inserted.id, source);
    return;
  }

  const { error: updateError } = await admin
    .from("subscribers")
    .update({ unsubscribed_at: unsubscribedAt })
    .eq("id", existing.id);
  if (updateError) throw new Error(updateError.message);

  await writeLeadSource(admin, existing.id, source);
}

export async function notifySubscribersOfArticle(articleId: string) {
  try {
    await notifySubscribersOfArticleInner(articleId);
  } catch (err) {
    console.error(
      "notifySubscribersOfArticle failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

async function notifySubscribersOfArticleInner(articleId: string) {
  if (!isMailConfigured()) {
    console.warn("SMTP is not configured; skipping subscriber emails");
    return;
  }

  const mailer = getMailer();
  if (!mailer) return;

  const admin = createAdminClient();
  const { data: article, error: articleError } = await admin
    .from("articles")
    .select("id, slug, title, dek, status, topic_id, topic:topics(id, slug, name)")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError) throw new Error(articleError.message);
  if (!article || article.status !== "published") return;

  const topic = Array.isArray(article.topic) ? article.topic[0] : article.topic;
  const topicId = article.topic_id;

  let interestQuery = admin
    .from("subscriber_interests")
    .select("subscriber_id");

  if (topicId) {
    interestQuery = interestQuery.or(
      `topic_id.eq.${topicId},and(topic_id.is.null,article_id.is.null)`,
    );
  } else {
    interestQuery = interestQuery.is("topic_id", null).is("article_id", null);
  }

  const { data: interestRows, error: interestError } = await interestQuery;
  if (interestError) throw new Error(interestError.message);

  const subscriberIds = [
    ...new Set((interestRows ?? []).map((row) => row.subscriber_id)),
  ];
  if (subscriberIds.length === 0) return;

  const [{ data: already }, { data: subscribers, error: subError }] =
    await Promise.all([
      admin
        .from("subscriber_notifications")
        .select("subscriber_id")
        .eq("article_id", articleId)
        .in("subscriber_id", subscriberIds),
      admin
        .from("subscribers")
        .select("id, email, unsubscribe_token, unsubscribed_at")
        .in("id", subscriberIds)
        .is("unsubscribed_at", null),
    ]);

  if (subError) throw new Error(subError.message);

  const sent = new Set((already ?? []).map((row) => row.subscriber_id));
  const recipients = (subscribers ?? []).filter((row) => !sent.has(row.id));
  if (recipients.length === 0) return;

  const site = getSiteUrl();
  const url = `${site}/article/${article.slug}`;
  const topicLabel = topic?.name ? ` in ${topic.name}` : "";
  const subject = `New on CFOmatics: ${article.title}`;
  const from = mailFrom();

  for (const recipient of recipients) {
    const unsub = `${site}/unsubscribe?token=${recipient.unsubscribe_token}`;
    try {
      await mailer.sendMail({
        from,
        to: recipient.email,
        subject,
        text: [
          `A new CFOmatics story${topicLabel} is live.`,
          "",
          article.title,
          article.dek,
          "",
          url,
          "",
          `Unsubscribe: ${unsub}`,
        ].join("\n"),
        html: subscriberEmailHtml({
          title: article.title,
          dek: article.dek,
          url,
          topicName: topic?.name ?? null,
          unsubscribeUrl: unsub,
        }),
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
        },
      });
      await admin.from("subscriber_notifications").insert({
        subscriber_id: recipient.id,
        article_id: articleId,
      });
    } catch (err) {
      console.error(
        `Failed to email ${recipient.email}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

function subscriberEmailHtml(args: {
  title: string;
  dek: string;
  url: string;
  topicName: string | null;
  unsubscribeUrl: string;
}) {
  const title = escapeHtml(args.title);
  const dek = escapeHtml(args.dek);
  const topic = args.topicName
    ? `<p style="margin:0 0 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">${escapeHtml(args.topicName)}</p>`
    : "";

  return `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f4f1ea;font-family:Georgia,serif;color:#111;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e7e2d6;">
    <p style="margin:0 0 18px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;">CFOmatics</p>
    ${topic}
    <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;">${title}</h1>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:#374151;">${dek}</p>
    <p style="margin:0 0 28px;">
      <a href="${args.url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;font-size:14px;">Read the story</a>
    </p>
    <p style="margin:0;font-size:12px;color:#6b7280;">
      You received this because you subscribed to related CFOmatics coverage.
      <a href="${args.unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}
