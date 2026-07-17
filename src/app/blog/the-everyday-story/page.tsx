import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Too Many Cookies: How Hemp Seeds Created the Everyday",
  description:
    "How a mom panic and a bag of hemp seeds created the Everyday — the organic chocolate chip cookie Jack's Cookies bakes in Red Bank, NJ. The full origin story, by founder Julianna Levine.",
  alternates: { canonical: "https://jacks-cookies.com/blog/the-everyday-story" },
  openGraph: {
    title: "Too Many Cookies: How Hemp Seeds Created the Everyday",
    description:
      "A mom panic, a bag of hemp seeds, and the batch that became the Everyday. By Julianna Levine, founder of Jack's Cookies, Red Bank NJ.",
    url: "https://jacks-cookies.com/blog/the-everyday-story",
    type: "article",
  },
};

const articleStructuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Too many cookies: how a mom panic (and a bag of hemp seeds) created the Everyday",
  description:
    "How hemp seeds accidentally created the Everyday, the organic chocolate chip cookie made by Jack's Cookies in Red Bank, NJ.",
  image: "https://jacks-cookies.com/og.jpg",
  author: {
    "@type": "Person",
    name: "Julianna Levine",
    jobTitle: "Founder & CEO, Jack's Cookies",
  },
  publisher: {
    "@type": "Organization",
    name: "Jack's Cookies",
    url: "https://jacks-cookies.com",
    logo: {
      "@type": "ImageObject",
      url: "https://jacks-cookies.com/brand/jacks-cookies-logo.png",
    },
  },
  datePublished: "2026-06-12",
  dateModified: "2026-07-17",
  mainEntityOfPage: "https://jacks-cookies.com/blog/the-everyday-story",
};

export default function TheEverydayStory() {
  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
      <article className="subpage">
        <Link className="subpage-back" href="/">
          ← Back to Jack&apos;s Cookies
        </Link>
        <p className="public-kicker">The Origin Story</p>
        <h1>
          Too many cookies: how a mom panic (and a bag of hemp seeds) created
          the Everyday
        </h1>
        <p className="byline">
          By Julianna Levine · Founder &amp; CEO, Jack&apos;s Cookies · Red
          Bank, NJ
        </p>
        <p>
          Jack&apos;s Cookies started as a weekend thing. Jack and I baked
          chocolate chip cookies together, he cracked the eggs, I ran the oven,
          and we gave the extras away. Then friends started asking for them.
          Then friends of friends. Suddenly we weren&apos;t baking a batch on
          Saturdays. We were baking all the time.
        </p>
        <p>
          We had a cookie situation. It got out of hand in the best possible
          way, except for one thing: my official taste-tester. Every batch
          needs Jack&apos;s approval before it goes anywhere, and &quot;every
          batch&quot; had become a lot of batches. Which meant my kid was
          eating a lot of cookies, and I was feeling that knot in my stomach
          that every mom knows.
        </p>
        <p>
          I didn&apos;t want to bench him. Tasting is his whole job. So I
          started thinking about the dough instead.
        </p>
        <p>
          I&apos;d been tossing hemp seeds into smoothies for a while, the way
          you do, and one afternoon I just stirred a handful into the cookie
          dough. I want to be honest: I had no idea if it would work. I had no
          idea what it would taste like. I was fully prepared to throw the
          whole batch out and never speak of it again.
        </p>
        <p>
          And then the magic happened. It didn&apos;t just work. It made the
          cookie better.
        </p>
        <p>
          A faint nutty something underneath the chocolate. A texture that
          somehow got softer and richer at the same time. Jack grabbed a second
          one off the rack and for the first time in weeks, I didn&apos;t
          flinch. That batch became the Everyday, almost overnight. It&apos;s
          the only cookie we make, and the hemp seeds have been in every single
          batch since.
        </p>
        <h2>So what do hemp seeds actually do?</h2>
        <p>
          We&apos;re bakers, not nutritionists, so we&apos;ll keep this to the
          boring facts. Hemp seeds are one of those quietly impressive foods:
        </p>
        <ul>
          <li>
            <strong>Complete plant protein</strong> — they contain all nine
            essential amino acids, which is rare for a plant.
          </li>
          <li>
            <strong>Omega-3 and omega-6 fatty acids</strong> — the good fats,
            in a ratio nutritionists actually like.
          </li>
          <li>
            <strong>Minerals</strong> — magnesium, iron, zinc, and vitamin E.
          </li>
          <li>
            <strong>A soft, nutty flavor</strong> — which it turns out belongs
            in a chocolate chip cookie. Who knew.
          </li>
        </ul>
        <p>
          None of that makes a cookie a health food. A cookie is still butter,
          sugar, chocolate, and joy, and it should be. The hemp seed just means
          our cookie shows up with a little something extra. As a mom, that
          little something turned out to be everything.
        </p>
        <p>Thanks for reading. Now go eat a cookie.</p>
        <p>
          <strong>xo, Julianna</strong>
        </p>
        <p className="subpage-cta">
          The cookie this whole story is about? You can order it —{" "}
          <Link href="/#order" className="inline-link">
            order The Everyday here
          </Link>
          . Questions first? See our{" "}
          <Link href="/faq" className="inline-link">
            FAQ
          </Link>
          .
        </p>
      </article>
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
