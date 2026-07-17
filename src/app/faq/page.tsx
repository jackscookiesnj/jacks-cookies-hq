import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Ordering Organic Chocolate Chip Cookies in Red Bank, NJ",
  description:
    "Answers about Jack's Cookies: where we're located, what's in the Everyday, pricing ($3 a cookie, from 3 to 1,000), pickup and local delivery in Red Bank NJ, and wholesale.",
  alternates: { canonical: "https://jacks-cookies.com/faq" },
  openGraph: {
    title: "Jack's Cookies FAQ",
    description:
      "Where to get the Everyday, our organic hemp-seed chocolate chip cookie, in Red Bank, NJ — pricing, pickup, delivery, and wholesale.",
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
