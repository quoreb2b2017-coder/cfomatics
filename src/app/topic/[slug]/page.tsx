import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ArticleCard } from "@/components/ArticleCard";
import TopicSearchBox from "@/components/TopicSearchBox";
import { getTopicBySlug } from "@/lib/topics";
import { getArticlesByTopicSlug } from "@/lib/articles";

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

  const articles = await getArticlesByTopicSlug(slug, 30);

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
            {articles.length === 0 && (
              <p style={{ color: "var(--ink-2)" }}>
                No articles published in this topic yet.
              </p>
            )}
            {articles.map((article) => (
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
                <form className="js-fake-subscribe">
                  <input type="email" placeholder="Work email" required />
                  <button className="btn btn-solid" type="submit">
                    Sign up
                  </button>
                  <p className="consent">
                    By signing up you agree to our Terms and Privacy Policy.
                  </p>
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
