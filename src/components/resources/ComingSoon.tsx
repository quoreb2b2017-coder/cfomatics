import Link from "next/link";

export default function ComingSoon({ label }: { label: string }) {
  return (
    <div className="wrap res-soon">
      <h2>Coming soon</h2>
      <p>{label} will be listed here once one is published.</p>
      <p className="res-soon-links">
        <Link href="/blog">Blogs</Link>
        <Link href="/resources/whitepapers?type=whitepaper">White papers</Link>
      </p>
    </div>
  );
}
