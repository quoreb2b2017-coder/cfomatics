import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { getTopics } from "@/lib/topics";

export default async function SiteFooter() {
  const topics = await getTopics();

  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-rule" aria-hidden />
        <div className="foot-grid">
          <div className="foot-brand">
            <BrandLogo variant="onDark" />
            <p>
              News and analysis for finance leaders - covering the decisions,
              standards, and technology shaping the office of the CFO.
            </p>
            <form className="foot-nl js-fake-subscribe" data-source="footer">
              <label htmlFor="foot-email" className="sr-only">
                Work email
              </label>
              <input
                id="foot-email"
                type="email"
                name="email"
                placeholder="Work email"
                required
              />
              <button type="submit" className="btn btn-solid">
                Subscribe
              </button>
            </form>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/about#standards">Editorial standards</Link>
              </li>
              <li>
                <Link href="/resources">Resource library</Link>
              </li>
              <li>
                <Link href="/#nl">Newsletter</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Topics</h4>
            <ul>
              {topics.map((topic) => (
                <li key={topic.id}>
                  <Link href={`/topic/${topic.slug}`}>{topic.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Partners</h4>
            <ul>
              <li>
                <Link href="/about#advertise">Advertise</Link>
              </li>
              <li>
                <Link href="/about#advertise">Sponsored content</Link>
              </li>
              <li>
                <Link href="/resources#lead">Lead generation</Link>
              </li>
              <li>
                <Link href="/about#contact">Contact us</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot-btm">
          <span>© {new Date().getFullYear()} CFOmatics. All rights reserved.</span>
          <span className="foot-legal">
            <Link href="/about#standards">Privacy</Link>
            <span aria-hidden>·</span>
            <Link href="/about#standards">Terms</Link>
            <span aria-hidden>·</span>
            <Link href="/about#contact">Contact</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
