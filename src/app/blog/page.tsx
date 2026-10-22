import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ResourceHero from "@/components/resources/ResourceHero";
import { ArticleGridCard } from "@/components/ArticleCard";
import { getLatestArticles } from "@/lib/articles";
import { SITE_NAME } from "@/lib/resources";

export const metadata: Metadata = {
  title: `Blogs - ${SITE_NAME}`,
  description: `News and analysis from ${SITE_NAME}.`,
};

export default async function BlogIndexPage() {
  const articles = await getLatestArticles(48);
  return (
    <>
      <SiteHeader />
      <ResourceHero
        badge="Blogs"
        title="News and analysis"
        lede={`${SITE_NAME} reporting for finance leaders. These are articles, not PDF downloads.`}
        pillars={["Newsroom", "Analysis", "Briefings"]}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { label: "Blogs" },
        ]}
      />
      <div className="wrap" style={{ padding: "12px 0 64px" }}>
        {articles.length === 0 ? (
          <p>No published stories yet.</p>
        ) : (
          <div className="cgrid">
            {articles.map((article) => (
              <ArticleGridCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
