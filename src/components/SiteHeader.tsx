import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import BrandLogo from "@/components/BrandLogo";
import MobileNav from "@/components/MobileNav";
import HeaderSpacer from "@/components/HeaderSpacer";
import { getTopics } from "@/lib/topics";

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export default async function SiteHeader({
  showTicker = true,
}: {
  showTicker?: boolean;
} = {}) {
  const topics = await getTopics();
  const topicLinks = topics.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
  }));

  return (
    <>
      <header className="site-header">
        <div className="util">
          <div className="wrap util-in">
            <span className="tag">
              Financial intelligence for the office of the CFO
            </span>
            <span className="r">
              <span className="date">{todayLabel()}</span>
              <Link href="/about">About</Link>
              <Link href="/#nl">Newsletter</Link>
            </span>
          </div>
        </div>

        <div className="mast">
          <div className="wrap mast-in">
            <BrandLogo />
            <div className="mast-r">
              <SearchBar />
              <Link href="/#nl" className="btn btn-solid mast-subscribe">
                Subscribe
              </Link>
              <MobileNav topics={topicLinks} />
            </div>
          </div>
        </div>

        <nav className="snav" aria-label="Topics">
          <div className="wrap snav-in">
            {topicLinks.map((topic) => (
              <Link key={topic.id} href={`/topic/${topic.slug}`}>
                {topic.name}
              </Link>
            ))}
            <Link href="/resources" className="res">
              Resources
            </Link>
          </div>
        </nav>
      </header>
      <HeaderSpacer />

      {showTicker && topicLinks.length > 0 && (
        <div className="ticker" aria-hidden>
          <div className="ticker-track">
            {[...topicLinks, ...topicLinks].map((t, i) => (
              <span key={`${t.id}-${i}`}>{t.name}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
