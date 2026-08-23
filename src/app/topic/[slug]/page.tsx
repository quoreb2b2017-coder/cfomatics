import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ArticleCard, ArticleGridCard } from "@/components/ArticleCard";
import TopicSearchBox from "@/components/TopicSearchBox";
import { getTopicBySlug } from "@/lib/topics";
import { fillArticleRow, getArticlesByTopicSlug, getLatestArticles } from "@/lib/articles";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return {};

  return {
    title: `${topic.name} - CFOmatics`,
    description:
      topic.description ??
      `${topic.name} news and analysis for CFOs and finance leaders.`,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const [articles, latest] = await Promise.all([
    getArticlesByTopicSlug(slug, 30),
    getLatestArticles(12),
  ]);
  const featured = articles.slice(0, 3);
  const rest = articles.filter((a) => !featured.some((f) => f.id === a.id));
  const more = fillArticleRow(
    [],
    latest,
    3,
    [...featured, ...rest].map((a) => a.id),
  );

  return (
    <>
      <SiteHeader />
      <div className="wrap">
        <div className="thero">
          <span className="kicker k">Topic</span>
          <h1>{topic.name}</h1>
          {topic.description && <p>{topic.description}</p>}
        </div>
      </div>
      <div className="wrap">
        <div className="body-grid">
          <main className="feed">
            <TopicSearchBox topicSlug={topic.slug} topicName={topic.name} />
            {featured.length > 0 && (
              <div className="cgrid" style={{ marginBottom: 28 }}>
                {featured.map((a) => (
                  <ArticleGridCard key={a.id} article={a} />
                ))}
              </div>
            )}
            {articles.length === 0 && (
              <p style={{ color: "var(--ink-2)" }}>
                No articles published in this topic yet.
              </p>
            )}
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </main>
          <aside className="side">
            <div className="box nlbox">
              <div className="bh">{topic.name} Weekly</div>
              <div className="bb">
                <p>
                  The week&apos;s most important {topic.name.toLowerCase()}{" "}
                  stories from CFOmatics.
                </p>
                <form
                  className="js-fake-subscribe"
                  data-source="topic"
                  data-topic-id={topic.id}
                  data-topic-slug={topic.slug}
                  data-topic-name={topic.name}
                >
                  <input type="email" name="email" placeholder="Work email" required />
                  <button className="btn btn-solid" type="submit">
                    Sign up
                  </button>
                  <p className="consent">
                    By signing up you agree to our Terms and Privacy Policy.
                  </p>
                </form>
              </div>
            </div>
            {latest.length > 0 && (
              <div className="box">
                <div className="bh">Most read</div>
                <div className="bb">
                  <ol className="mostread">
                    {latest.slice(0, 5).map((a, i) => (
                      <li key={a.id}>
                        <span className="n">{i + 1}</span>
                        <Link href={`/article/${a.slug}`}>{a.title}</Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            <div className="promo">
              <span className="tg">Free report</span>
              <h4>2026 CFO Priorities Benchmark</h4>
              <p>
                How finance leaders are allocating budget, headcount, and
                technology this year.
              </p>
              <Link href="/resources" className="btn btn-ghost">
                Download →
              </Link>
            </div>
          </aside>
        </div>
      </div>
      {more.length > 0 && (
        <div className="band paper2">
          <div className="wrap">
            <div className="shead">
              <h2>
                More from CFOmatics <span className="kicker">Section</span>
              </h2>
              <Link href="/" className="more">
                All stories →
              </Link>
            </div>
            <div className="cgrid">
              {more.map((a) => (
                <ArticleGridCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </div>
      )}
      <SiteFooter />
    </>
  );
}
