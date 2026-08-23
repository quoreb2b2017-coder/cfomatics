import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminPageHeader({
  kicker = "Admin",
  title,
  description,
  action,
  backHref,
  backLabel = "Back",
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="admin-pagehead">
      <div>
        {backHref && (
          <Link href={backHref} className="admin-back">
            ← {backLabel}
          </Link>
        )}
        <span className="admin-pagehead-kicker">{kicker}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action ? <div className="admin-pagehead-action">{action}</div> : null}
    </header>
  );
}
