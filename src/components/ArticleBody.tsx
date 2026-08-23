import type { ArticleBody as ArticleBodyJson } from "@/types/database";
import ArticleChart from "@/components/ArticleChart";

// Renders **bold** inline markup only — the one intentional exception to
// storing body_json as plain strings (see supabase/schema.sql).
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <b key={i}>{part.slice(2, -2)}</b>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function isValidChart(body: ArticleBodyJson) {
  const chart = body.chart;
  if (!chart) return false;
  if (chart.labels.length < 2 || chart.series.length === 0) return false;
  return chart.series.every((s) => s.values.length === chart.labels.length);
}

export default function ArticleBody({ body }: { body: ArticleBodyJson }) {
  return (
    <div className="prose">
      <p className="lede">
        <InlineText text={body.lede} />
      </p>
      {isValidChart(body) && body.chart && <ArticleChart chart={body.chart} />}
      {body.sections.map((section, i) => (
        <div key={i}>
          {section.heading && <h2>{section.heading}</h2>}
          {section.paragraphs.map((p, j) => (
            <p key={j}>
              <InlineText text={p} />
            </p>
          ))}
          {i === 0 && body.pullQuote && (
            <div className="pquote">
              <InlineText text={body.pullQuote} />
            </div>
          )}
        </div>
      ))}
      {body.takeaways && body.takeaways.length > 0 && (
        <div className="takeaways">
          <h4>Key takeaways</h4>
          <ul>
            {body.takeaways.map((t, i) => (
              <li key={i}>
                <InlineText text={t} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
