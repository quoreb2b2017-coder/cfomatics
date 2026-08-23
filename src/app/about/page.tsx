import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About - CFOmatics",
  description: "CFOmatics is a digital publication covering news and analysis for CFOs and finance leaders.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
<div className="wrap"><div className="thero">
  <span className="kicker k">About</span>
  <h1>Financial intelligence for the office of the CFO</h1>
  <p>CFOmatics is a digital publication covering the news, standards, and technology shaping corporate finance - written for CFOs, controllers, treasurers, and the teams around them.</p>
</div></div>

<div className="wrap"><div className="body-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
  <main className="prose" style={{ maxWidth: 'none', fontSize: '19px' }}>
    <p className="lede">CFOmatics exists to help finance leaders make better decisions with less noise. We cover what actually moves the office of the CFO - reporting standards, planning, treasury, risk, tax, technology, and leadership - and we translate complex developments into clear, useful analysis.</p>
    <h2 id="standards">Editorial standards</h2>
    <p>Our journalism is independent. We separate reporting from sponsored content, label partner material clearly, and hold studio-produced resources to the same accuracy standards as our newsroom. When we get something wrong, we correct it transparently.</p>
    <h2>What we cover</h2>
    <p>Financial reporting and accounting standards; FP&amp;A and the shift to continuous planning; treasury, cash, and payments; risk and compliance; corporate tax; the finance-technology stack; and the evolving role of the finance leader.</p>
    <h2 id="advertise">Reach our audience</h2>
    <p>CFOmatics reaches finance decision-makers actively researching solutions for their teams. We help partners connect with that audience through sponsored content, custom research, webinars, and lead-generation programs - all produced to editorial standard and delivered with clear consent. To explore a partnership, get in touch below.</p>
    <h2 id="contact">Contact</h2>
    <p>Editorial: <a href="mailto:editorial@cfomatics.com">editorial@cfomatics.com</a><br />Advertising &amp; partnerships: <a href="mailto:partners@cfomatics.com">partners@cfomatics.com</a></p>
  </main>
  <aside className="side">
    <div className="box nlbox" id="nl"><div className="bh">The CFOmatics Daily</div><div className="bb">
      <p>Finance news worth your five minutes, every morning.</p>
      <form className="js-fake-subscribe" data-source="about"><input type="email" name="email" placeholder="Work email" required /><button className="btn btn-solid" type="submit">Sign up</button>
      <p className="consent">By signing up you agree to our Terms and Privacy Policy.</p></form></div></div>
    <div className="promo"><span className="tg">For partners</span><h4>Advertise with CFOmatics</h4><p>Reach finance leaders actively evaluating solutions.</p><a href="mailto:partners@cfomatics.com" className="btn btn-ghost">Get in touch →</a></div>
  </aside>
</div></div>
      <SiteFooter />
    </>
  );
}
