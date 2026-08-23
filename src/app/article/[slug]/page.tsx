import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleBody from "@/components/ArticleBody";
import CoverImage from "@/components/CoverImage";
import JsonLd from "@/components/JsonLd";
import { ArticleGridCard } from "@/components/ArticleCard";
import { getArticleBySlug, getArticlesByTopicSlug, getLatestArticles } from "@/lib/articles";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.meta_title || article.title;
  const description = article.meta_description || article.dek;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cfomatics.com";
  const url = `${siteUrl}/article/${article.slug}`;
  const ogTitle =
    article.body_json?.seo?.og_title || article.title || title;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: "CFOmatics",
      locale: "en_US",
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: [article.author_name],
      section: article.topic?.name,
      images: article.cover_image_url
        ? [
            {
              url: article.cover_image_url,
              alt: article.cover_image_alt || article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

function formatDateLong(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, latest] = await Promise.all([
    article.topic
      ? getArticlesByTopicSlug(article.topic.slug, 5).then((rows) =>
          rows.filter((a) => a.id !== article.id),
        )
      : Promise.resolve([]),
    getLatestArticles(6),
  ]);

  const moreInTopic = related.slice(0, 4);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cfomatics.com";

  return (
    <>
      <SiteHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.dek,
          image: article.cover_image_url ? [article.cover_image_url] : undefined,
          datePublished: article.published_at,
          dateModified: article.updated_at,
          author: { "@type": "Organization", name: article.author_name },
          publisher: {
            "@type": "Organization",
            name: "CFOmatics",
          },
          mainEntityOfPage: `${siteUrl}/article/${article.slug}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            article.topic && {
              "@type": "ListItem",
              position: 2,
              name: article.topic.name,
              item: `${siteUrl}/topic/${article.topic.slug}`,
            },
            {
              "@type": "ListItem",
              position: article.topic ? 3 : 2,
              name: article.title,
              item: `${siteUrl}/article/${article.slug}`,
            },
          ].filter(Boolean),
        }}
      />

      <article className="article-page">
        <div className="wrap">
          <nav className="art-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            {article.topic && (
              <>
                <Link href={`/topic/${article.topic.slug}`}>
                  {article.topic.name}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span className="art-crumbs-current">Article</span>
          </nav>

          {/* 1) Hero image first */}
          <figure className="art-cover-figure art-cover-figure--hero">
            <div className="art-cover">
              <CoverImage
                src={article.cover_image_url}
                alt={article.cover_image_alt}
                seed={article.slug}
                label={article.topic?.name}
                priority
              />
            </div>
          </figure>

          {/* 2) Title + content left, topics right */}
          <div className="art-layout">
            <div className="art-main">
              <header className="art-head">
                {article.topic ? (
                  <Link
                    href={`/topic/${article.topic.slug}`}
                    className="art-topic-badge"
                  >
                    {article.topic.name}
                  </Link>
                ) : (
                  <span className="art-topic-badge art-topic-badge--muted">
                    Uncategorized
                  </span>
                )}
                <h1>{article.title}</h1>
                <p className="dek">{article.dek}</p>
                <div className="art-byline">
                  <div className="who">
                    <span className="art-avatar" aria-hidden>
                      {article.author_name.charAt(0)}
                    </span>
                    <div>
                      <b>{article.author_name}</b>
                      <span>
                        {formatDateLong(article.published_at)}
                        <span className="art-dot" aria-hidden>
                          ·
                        </span>
                        {article.read_time_minutes ?? 5} min read
                      </span>
                    </div>
                  </div>
                </div>
              </header>

              <div className="art-body-wrap">
                <ArticleBody body={article.body_json} />
              </div>
            </div>

            <aside className="art-side side">
              {article.topic && (
                <div className="box art-topic-stories">
                  <div className="bh">
                    More in {article.topic.name}
                  </div>
                  <div className="bb">
                    {moreInTopic.length > 0 ? (
                      <ul className="art-side-stories">
                        {moreInTopic.map((a) => (
                          <li key={a.id}>
                            <Link
                              href={`/article/${a.slug}`}
                              className="art-side-story"
                            >
                              <span className="art-side-story-title">
                                {a.title}
                              </span>
                              {a.dek && (
                                <span className="art-side-story-dek">
                                  {a.dek}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="art-side-empty">
                        More {article.topic.name} coverage coming soon.
                      </p>
                    )}
                    <Link
                      href={`/topic/${article.topic.slug}`}
                      className="art-side-more"
                    >
                      All {article.topic.name} stories →
                    </Link>
                  </div>
                </div>
              )}

              <div className="box nlbox">
                <div className="bh">Stay informed</div>
                <div className="bb">
                  <p>Finance news worth five minutes, every morning.</p>
                  <form>
                    <input type="email" placeholder="Work email" required />
                    <button className="btn btn-solid" type="submit">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {latest.filter((a) => a.id !== article.id).length > 0 && (
        <section className="art-related">
          <div className="wrap">
            <div className="shead">
              <h2>More from CFOmatics</h2>
              <Link href="/" className="more">
                All stories →
              </Link>
            </div>
            <div className="cgrid">
              {latest
                .filter((a) => a.id !== article.id)
                .slice(0, 3)
                .map((a) => (
                  <ArticleGridCard key={a.id} article={a} />
                ))}
            </div>
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  );
}
