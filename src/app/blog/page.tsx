import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Cookie Journal — Stories from a Red Bank, NJ Cottage Bakery",
  description:
    "Notes from the kitchen at Jack's Cookies in Red Bank, NJ: how hemp seeds created the Everyday, what makes a chocolate chip cookie organic, and honest answers about hemp seed cookies.",
  alternates: { canonical: "https://jacks-cookies.com/blog" },
  openGraph: {
    title: "The Cookie Journal — Jack's Cookies",
    description:
      "Stories from the kitchen at Jack's Cookies, the home-based cottage bakery in Red Bank, NJ behind the Everyday organic chocolate chip cookie.",
    url: "https://jacks-cookies.com/blog",
  },
};

const posts = [
  {
    href: "/blog/the-everyday-story",
    title:
      "Too many cookies: how a mom panic (and a bag of hemp seeds) created the Everyday",
    summary:
      "The origin story of our one cookie — how stirring hemp seeds into the dough for a little extra nutrition accidentally created the best batch we'd ever baked. By founder Julianna Levine.",
  },
  {
    href: "/blog/do-hemp-seed-cookies-get-you-high",
    title: "Do hemp seed cookies get you high? (No — here's why)",
    summary:
      "The honest answer about culinary hemp seeds: why the hemp in our chocolate chip cookies is a food, not a drug, and what those seeds actually add.",
  },
  {
    href: "/blog/what-makes-a-chocolate-chip-cookie-organic",
    title: "What makes a chocolate chip cookie organic?",
    summary:
      "What the word actually means on an ingredient list, what we look for when we buy flour, butter, and chocolate, and why it matters for a small-batch bakery.",
  },
];

const blogStructuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://jacks-cookies.com/blog#blog",
  name: "The Cookie Journal — Jack's Cookies",
  url: "https://jacks-cookies.com/blog",
  description:
    "Stories from the kitchen at Jack's Cookies, a home-based cottage bakery in Red Bank, New Jersey.",
  publisher: {
    "@type": "Organization",
    name: "Jack's Cookies",
    url: "https://jacks-cookies.com",
  },
  blogPost: posts.map((p) => ({
    "@type": "BlogPosting",
    headline: p.title,
    url: `https://jacks-cookies.com${p.href}`,
  })),
};

export default function BlogIndex() {
  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructuredData) }}
      />
      <div className="subpage">
        <Link className="subpage-back" href="/">
          ← Back to Jack&apos;s Cookies
        </Link>
        <p className="public-kicker">The Cookie Journal</p>
        <h1>Notes from the kitchen</h1>
        <p className="byline">
          Stories from Jack&apos;s Cookies, a home-based cottage bakery in Red
          Bank, New Jersey — how the Everyday came to be, and what we&apos;ve
          learned baking one cookie really well.
        </p>
        {posts.map((p) => (
          <div key={p.href} className="faq-item">
            <h2>
              <Link href={p.href}>{p.title}</Link>
            </h2>
            <p>{p.summary}</p>
          </div>
        ))}
        <p className="subpage-cta">
          Hungry now?{" "}
          <Link href="/#order" className="inline-link">
            Order The Everyday
          </Link>{" "}
          — or see{" "}
          <Link href="/faq" className="inline-link">
            frequently asked questions
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
