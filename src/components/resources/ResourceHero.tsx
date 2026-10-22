import Link from "next/link";

export default function ResourceHero({
  badge,
  title,
  lede,
  pillars,
  crumbs,
}: {
  badge: string;
  title: string;
  lede: string;
  pillars: readonly string[];
  crumbs: { href?: string; label: string }[];
}) {
  return (
    <section className="res-hero">
      <div className="res-hero-line" aria-hidden />
      <div className="wrap res-hero-grid">
        <div>
          <nav className="res-crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`}>
                {index > 0 && <span aria-hidden> / </span>}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              </span>
            ))}
          </nav>
          <p className="res-badge">{badge}</p>
          <h1>{title}</h1>
          <p className="res-lede">{lede}</p>
          <ul className="res-pillars">
            {pillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </div>
        <div className="res-hero-visual" aria-hidden>
          <div className="res-hero-sheet">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
