import Link from "next/link";
import CoverImage from "@/components/CoverImage";
import type { ArticleWithTopic } from "@/types/database";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function ArticleCard({ article }: { article: ArticleWithTopic }) {
  return (
    <article className="acard reveal">
      <Link
        href={`/article/${article.slug}`}
        className="cover"
        aria-label={article.title}
      >
        <CoverImage
          src={article.cover_image_url}
          alt={article.cover_image_alt}
          seed={article.slug}
          label={article.topic?.name}
        />
      </Link>
      <div className="acard-body">
        {article.topic && (
          <span className="kicker">{article.topic.name}</span>
        )}
        <h3>
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="dek">{article.dek}</p>
        <div className="meta">
          <span>{article.read_time_minutes ?? 5} min read</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
    </article>
  );
}

export function ArticleGridCard({ article }: { article: ArticleWithTopic }) {
  return (
    <article className="gcard reveal">
      <Link
        href={`/article/${article.slug}`}
        className="cover"
        aria-label={article.title}
      >
        <CoverImage
          src={article.cover_image_url}
          alt={article.cover_image_alt}
          seed={article.slug}
          label={article.topic?.name}
        />
      </Link>
      <div className="gcard-body">
        {article.topic && <span className="kicker">{article.topic.name}</span>}
        <h3>
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="dek">{article.dek}</p>
        <div className="meta">
          {article.read_time_minutes ?? 5} min read ·{" "}
          {formatDate(article.published_at)}
        </div>
      </div>
    </article>
  );
}
