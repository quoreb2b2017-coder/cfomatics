import Script from "next/script";

/** Alli AI SEO automation — deferred so it never blocks first paint. */
export default function AlliScript() {
  return (
    <Script id="alli-ai" strategy="lazyOnload">{`
/* Alli AI widget for www.cfomatics.com */
(function (w,d,s,o,f,js,fjs) {
  w['AlliJSWidget']=o;
  w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
  js = d.createElement(s);
  fjs = d.getElementsByTagName(s)[0];
  js.id = o;
  js.src = f;
  js.async = 1;
  fjs.parentNode.insertBefore(js, fjs);
})(window, document, 'script', 'alli', 'https://static.alliai.com/widget/v1.js');
alli('init', 'site_XmrJgx8PQraHMzs9');
alli('optimize', 'all');
`}</Script>
  );
}
