import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CoverImage from "@/components/CoverImage";
import { ArticleCard, ArticleGridCard } from "@/components/ArticleCard";
import { getLatestArticles, getArticlesByTopicSlug } from "@/lib/articles";
import { getTopics } from "@/lib/topics";

export const revalidate = 300;

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function Page() {
  const [latest, topics] = await Promise.all([
    getLatestArticles(100),
    getTopics(),
  ]);

  const topicSections = await Promise.all(
    topics.map(async (topic) => ({
      topic,
      articles: await getArticlesByTopicSlug(topic.slug, 3),
    })),
  );

  const [lead, ...rest] = latest;
  const topStories = rest.slice(0, 4);
  // Main feed: only 3 latest stories. Full topic coverage lives in sections below.
  const feed = rest.slice(0, 3);

  if (!lead) {
    return (
      <>
        <SiteHeader />
        <div className="wrap" style={{ padding: "80px 0", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-newsreader), serif" }}>
            No articles published yet
          </h1>
          <p style={{ color: "var(--ink-2)", marginTop: 8 }}>
            Sign in to <Link href="/admin">/admin</Link> to publish the first
            one, or wait for the next scheduled AI run.
          </p>
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <section className="lead">
        <div className="wrap lead-grid">
          <div className="lead-main">
            <Link href={`/article/${lead.slug}`} className="cover">
              <CoverImage
                src={lead.cover_image_url}
                alt={lead.cover_image_alt}
                seed={lead.slug}
                label={lead.topic?.name}
                priority
              />
            </Link>
            {lead.topic && <span className="kicker">{lead.topic.name}</span>}
            <h1>
              <Link href={`/article/${lead.slug}`}>{lead.title}</Link>
            </h1>
            <p className="dek">{lead.dek}</p>
            <div className="byline">
              <b>By {lead.author_name}</b>
              <span>{lead.read_time_minutes ?? 5} min read</span>
              <span>Published {formatDate(lead.published_at)}</span>
            </div>
          </div>
          {topStories.length > 0 && (
            <aside className="tops">
              <div className="th">Top stories</div>
              {topStories.map((a, i) => (
                <div className="top-item" key={a.id}>
                  <span className="n">{i + 1}</span>
                  <div>
                    <h3>
                      <Link href={`/article/${a.slug}`}>{a.title}</Link>
                    </h3>
                    {a.topic && (
                      <span
                        className="kicker k"
                        style={{ marginTop: 6, display: "inline-block" }}
                      >
                        {a.topic.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </aside>
          )}
        </div>
      </section>

      <div className="wrap">
        <div className="body-grid">
          <main className="feed">
            <div className="shead">
              <h2>Latest stories</h2>
              <span className="more" style={{ cursor: "default" }}>
                Showing {feed.length}
              </span>
            </div>
            {feed.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {feed.length === 0 && (
              <p style={{ color: "var(--ink-2)" }}>More stories coming soon.</p>
            )}
          </main>
          <aside className="side">
            <div className="box nlbox">
              <div className="bh">The CFOmatics Daily</div>
              <div className="bb">
                <p>
                  The finance headlines that matter, in your inbox each
                  morning. Free.
                </p>
                <form className="js-fake-subscribe">
                  <input type="email" placeholder="Work email" required />
                  <button className="btn btn-solid" type="submit">
                    Sign up
                  </button>
                  <p className="consent">
                    By signing up you agree to our Terms and Privacy Policy.
                    Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </div>

            {topics.length > 0 && (
              <div className="box">
                <div className="bh">Topics</div>
                <div className="bb">
                  <ul className="topic-list">
                    {topics.map((t) => (
                      <li key={t.id}>
                        <Link href={`/topic/${t.slug}`}>{t.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

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

      {topicSections
        .filter((s) => s.articles.length > 0)
        .map(({ topic, articles }, index) => (
          <div
            key={topic.id}
            className={`band ${index % 2 === 0 ? "paper2" : ""}`}
          >
            <div className="wrap">
              <div className="shead">
                <h2>
                  {topic.name} <span className="kicker">Section</span>
                </h2>
                <Link href={`/topic/${topic.slug}`} className="more">
                  All {topic.name.toLowerCase()} →
                </Link>
              </div>
              <div className="cgrid">
                {articles.map((a) => (
                  <ArticleGridCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          </div>
        ))}

      <div className="wrap" style={{ padding: "44px 0 56px" }} id="nl">
        <div className="gate gate-nl">
          <div className="gate-l">
            <span className="tg">Newsletter</span>
            <h2>Don&apos;t miss what&apos;s moving the office of the CFO</h2>
            <p>
              Get the day&apos;s most important finance news and analysis,
              distilled into a five-minute read.
            </p>
            <p className="gate-l-note">
              Join finance leaders reading CFOmatics.
            </p>
          </div>
          <div className="gate-r gate-r-form">
            <span className="gate-r-badge">Subscribe</span>
            <form className="gate-nl-form js-fake-subscribe">
              <label htmlFor="home-nl-email" className="sr-only">
                Work email
              </label>
              <input
                id="home-nl-email"
                type="email"
                name="email"
                placeholder="Work email"
                required
              />
              <button type="submit" className="btn btn-solid">
                Subscribe free
              </button>
              <p className="gate-nl-consent">Free. Unsubscribe anytime.</p>
            </form>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
