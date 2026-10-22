import Link from "next/link";
import { SITE_NAME } from "@/lib/resources";

export default function SponsorBar({ kind = "download" }: { kind?: string }) {
  return (
    <div className="res-sponsor">
      <p>
        This {kind} is brought to you through {SITE_NAME}. {SITE_NAME} publishes
        finance research for the office of the CFO. Read our{" "}
        <Link href="/privacy">privacy statement</Link>.
      </p>
      <div className="res-sponsor-actions">
        <Link href="/unsubscribe">Unsubscribe</Link>
        <span aria-hidden>|</span>
        <Link href="/privacy#sharing">Do Not Sell My Data</Link>
      </div>
    </div>
  );
}
