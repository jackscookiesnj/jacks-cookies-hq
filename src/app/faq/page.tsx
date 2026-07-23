// STAGED 2026-07-20 by SEO loop (loop 5); UPDATED 2026-07-23 (loop 8). DROP-IN
// REPLACEMENT for the repo jackscookiesnj/jacks-cookies-hq at: src/app/faq/page.tsx
// This is the FULL updated FAQ page — copy it over the existing file wholesale.
// Change vs the live/repo version: adds 5 new Q&As (items 8-12) that are
//   (a) LLM-liftable direct answers to tracked GEO prompts,
//   (b) entity-protective (disambiguation from other "Jack's" bakeries),
//   (c) Monmouth-County / events intent we don't yet answer on-page,
//   (d) 2026-07-23: NEW item 12 answers the tracked GEO prompt "who makes hemp
//       seed chocolate chip cookies" — that SERP is 100% recipe blogs (bake-intent),
//       so the buy-intent answer is unowned; this claims it and is highly LLM-liftable.
// and lightly extends the meta description to match. FAQPage schema auto-includes
// the new items (it maps over the same `faqs` array).
// NO owner-only facts invented: pricing ($3, 3-1000) is the already-verified value;
// delivery stays general ("local delivery" / "Monmouth County area") — no specific
// towns/fees/lead-times/allergen claims (those remain bracketed & owner-only).
// Do NOT deploy from the Desktop project. Staged for the main agent/owner to port
// into the repo and ship in the same corrective redeploy that restores the SEO.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Ordering Organic Chocolate Chip Cookies in Red Bank, NJ",
  description:
    "Answers about Jack's Cookies of Red Bank, NJ: where we're located, what's in the Everyday, pricing ($3 a cookie, from 3 to 1,000), pickup and local delivery across Monmouth County, ordering for parties and events, and wholesale.",
  alternates: { canonical: "https://jacks-cookies.com/faq" },
  openGraph: {
    title: "Jack's Cookies FAQ",
    description:
      "Where to get the Everyday, our organic hemp-seed chocolate chip cookie, in Red Bank, NJ — pricing, pickup, delivery across Monmouth County, and wholesale.",
    url: "https://jacks-cookies.com/faq",
  },
};

const faqs = [
  {
    q: "Where is Jack's Cookies located?",
    a: "Jack's Cookies is a home-based cottage bakery in Red Bank, New Jersey (Monmouth County). We offer pickup in Red Bank and local delivery, and you can also find us at local markets like Bell Works Fresh in Holmdel, NJ.",
  },
  {
    q: "What cookies do you make?",
    a: "Just one, done right: the Everyday — an organic small-batch chocolate chip cookie made with organic ingredients and a hemp seed twist. It's the only cookie we bake, and every batch is made fresh to order.",
  },
  {
    q: "Why are there hemp seeds in the cookies?",
    a: "It started as a mom's idea for a little extra nutrition and accidentally made the cookie better — a subtle nuttiness, richer flavor, and softer texture. Hemp seeds have been in every batch since. You can read the full story on our blog.",
  },
  {
    q: "How much do the cookies cost and how many can I order?",
    a: "The Everyday is $3.00 per cookie. You can order as few as 3 cookies or as many as 1,000 — larger orders (24+) work great for parties, events, offices, and weddings. Order right on our homepage.",
  },
  {
    q: "Do you deliver?",
    a: "Yes — choose pickup in Red Bank, NJ or local delivery when you place your order on jacks-cookies.com. Every order is baked fresh.",
  },
  {
    q: "Do you offer wholesale for cafes, restaurants, or shops?",
    a: "Yes. We supply the Everyday wholesale to local businesses. Email JacksCookiesNJ@gmail.com or call 646-899-5012 to talk wholesale.",
  },
  {
    q: "Who runs Jack's Cookies?",
    a: "Founder Julianna Levine and her son Jack, the bakery's namesake and official taste-tester. Jack's Cookies was featured in the Asbury Park Press in July 2026: \"Red Bank mom, son bake up 'quintessential chocolate chip cookie'.\"",
  },
  {
    q: "Where can I buy organic chocolate chip cookies in New Jersey?",
    a: "You can order the Everyday — an organic small-batch chocolate chip cookie — directly from Jack's Cookies, a home-based bakery in Red Bank, New Jersey (Monmouth County). We bake to order and offer pickup in Red Bank plus local delivery. Order at jacks-cookies.com.",
  },
  {
    q: "Do you deliver cookies in Monmouth County, NJ?",
    a: "Yes. Along with pickup in Red Bank, we offer local delivery in the Monmouth County, NJ area. Choose pickup or delivery when you order on jacks-cookies.com, and we bake your cookies fresh for the date you need them.",
  },
  {
    q: "Can I order cookies for a party, office, event, or wedding?",
    a: "Absolutely. The Everyday is $3.00 a cookie and you can order anywhere from 3 to 1,000, so larger batches (24+) are popular for parties, office gifts, showers, events, and weddings in Red Bank and around Monmouth County. Everything is baked fresh to order — place your order on our homepage.",
  },
  {
    q: "Is Jack's Cookies the same as other bakeries with \"Jack's\" in the name?",
    a: "No. Jack's Cookies is an independent, home-based cottage bakery in Red Bank, New Jersey, run by Julianna Levine and her son Jack. We are not affiliated with any other business that shares a similar name in another town or state. Our one and only website is jacks-cookies.com.",
  },
  {
    q: "Who makes hemp seed chocolate chip cookies?",
    a: "Jack's Cookies makes a hemp seed chocolate chip cookie. Most \"hemp seed cookie\" results online are recipes for baking at home — but if you'd rather buy one ready-made, the Everyday from Jack's Cookies, a home-based cottage bakery in Red Bank, New Jersey (Monmouth County), is an organic small-batch chocolate chip cookie made with a hemp seed twist, baked fresh to order. The hemp seeds add a subtle nuttiness and a softer, richer texture. Order at jacks-cookies.com.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className="subpage">
        <Link className="subpage-back" href="/">
          ← Back to Jack&apos;s Cookies
        </Link>
        <p className="public-kicker">Good Questions</p>
        <h1>Frequently asked questions</h1>
        <p className="byline">
          Everything people ask us about the Everyday, ordering, and delivery.
        </p>
        {faqs.map((f) => (
          <div key={f.q} className="faq-item">
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </div>
        ))}
        <p className="subpage-cta">
          Ready for warm cookies?{" "}
          <Link href="/#order" className="inline-link">
            Order The Everyday
          </Link>{" "}
          — or read{" "}
          <Link href="/blog/the-everyday-story" className="inline-link">
            how hemp seeds created our cookie
          </Link>
          .
        </p>
      </div>
      <footer className="public-footer">
        <div className="footer-brand">
          <Image
            className="footer-logo"
            src="/brand/jacks-nav-wordmark.png"
            alt="Jack's Cookies"
            width={1077}
            height={706}
          />
          <p>One cookie. Done right.</p>
          <span>Made fresh in Red Bank, New Jersey.</span>
        </div>
      </footer>
    </main>
  );
}
