// STAGED 2026-07-22 by SEO loop (loop 7). DROP-IN Next.js route for the repo
// jackscookiesnj/jacks-cookies-hq at:
//   src/app/cookie-delivery-red-bank-nj/page.tsx
// Do NOT deploy from the Desktop project — this file is staged for the main agent/owner
// to port into the repo and ship. Mirrors the structure/classes/schema of the blog routes
// (src/app/blog/*/page.tsx) — reuses .public-site / .subpage / .public-kicker / .inline-link
// / .public-footer classes, no new design.
//
// WHY THIS PAGE (rotation slot (d) local landing content, elevated to a standalone page):
// "cookie delivery red bank nj" (Tier-1) is the SOFTEST SERP we track — nobody owns it with
// real local content (Gift Blooms drop-ship, Jersey Cookie Girl subscription, Insomnia chain,
// Yelp directory). Bang Cookies proves the per-geo delivery LANDING PAGE pattern ranks
// (/pages/cookie-delivery-in-new-jersey). This is that pattern applied to our winnable local
// long-tail: an exact-match descriptive URL, a first-two-sentence direct answer, Service +
// FAQPage schema, entity string throughout, and one clean funnel to /#order. Also serves
// Tier-2 "cookie delivery monmouth county nj" and the GEO prompt "cookie delivery near Red Bank NJ".
//
// This is the standalone-page upgrade of the 07-17 staged homepage delivery-section.html.
// Ship BOTH is fine (section on home + this page), or ship just this page — the page is the
// asset that ranks on the exact-match URL.
//
// FACT DISCIPLINE — verified facts only (from the live order form + llms.txt, owner-confirmed):
//   - $3.00 per cookie; order from 3 up to 1,000 cookies (07-17 main-agent correction to the
//     real app — NOT "boxes of 10–75", which was a stale early assumption).
//   - Bake days: Tuesday & Friday; cutoffs Sun 11:59pm (Tue batch) / Wed 11:59pm (Fri batch)
//     — these verified against the live order form on 07-17.
//   - Baked to order; home-based cottage bakery in Red Bank, NJ; pickup in Red Bank + local
//     delivery across Monmouth County.
// OWNER-ONLY FACTS left BRACKETED — DO NOT FILL, DO NOT GUESS (same as delivery-section.html):
//   [DELIVERY-TOWNS] exact Monmouth County towns in the zone
//   [DELIVERY-FEE]   delivery fee / free-delivery threshold
//   [DELIVERY-DAYS]  whether delivery runs on both bake days
//   [PICKUP-FREE]    whether Red Bank pickup is free
// No allergen/lead-time claim. No new claim about Jack (child) beyond site/press.
//
// ON PORT: add https://jacks-cookies.com/cookie-delivery-red-bank-nj to public/sitemap.xml
// (priority 0.8 — it's a commercial money page, higher than the blog posts' 0.7; changefreq
// monthly) and to public/llms.txt (under a "Key pages" line, so LLMs cite it for delivery
// questions). Internal-link to it from the homepage delivery section once both are live.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Delivery in Red Bank, NJ & Monmouth County",
  description:
    "Jack's Cookies delivers fresh-baked organic chocolate chip cookies across Monmouth County, NJ, with pickup in Red Bank. The Everyday is baked to order — never shipped from a warehouse. Order online at jacks-cookies.com.",
  alternates: {
    canonical: "https://jacks-cookies.com/cookie-delivery-red-bank-nj",
  },
  openGraph: {
    title: "Cookie Delivery in Red Bank, NJ & Monmouth County",
    description:
      "Fresh-baked organic chocolate chip cookies delivered across Monmouth County, NJ, with pickup in Red Bank — baked to order by Jack's Cookies.",
    url: "https://jacks-cookies.com/cookie-delivery-red-bank-nj",
    type: "website",
  },
};

const serviceStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://jacks-cookies.com/cookie-delivery-red-bank-nj#service",
  name: "Cookie delivery and pickup in Red Bank and Monmouth County, NJ",
  serviceType: "Cookie delivery",
  description:
    "Jack's Cookies delivers fresh-baked organic chocolate chip cookies across Monmouth County, New Jersey, with pickup in Red Bank. The Everyday is baked to order on Tuesday and Friday bake days in a home-based cottage bakery in Red Bank, NJ.",
  provider: {
    "@type": "Bakery",
    name: "Jack's Cookies",
    url: "https://jacks-cookies.com",
    telephone: "+1-646-899-5012",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Red Bank",
      addressRegion: "NJ",
      postalCode: "07701",
      addressCountry: "US",
    },
  },
  areaServed: [
    { "@type": "City", name: "Red Bank", addressRegion: "NJ" },
    { "@type": "AdministrativeArea", name: "Monmouth County, NJ" },
  ],
  availableChannel: {
    "@type": "ServiceChannel",
    serviceUrl: "https://jacks-cookies.com/#order",
    availableLanguage: { "@type": "Language", name: "English" },
  },
  offers: {
    "@type": "Offer",
    url: "https://jacks-cookies.com/#order",
    price: "3.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

// FAQ schema — every Q&A below is ALSO visible on the page (rule: no schema-only content).
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do you deliver cookies in Red Bank and Monmouth County, NJ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Jack's Cookies is a home-based cottage bakery in Red Bank, NJ, and we deliver fresh-baked organic chocolate chip cookies locally across Monmouth County. You can also pick up your order in Red Bank. Choose pickup or delivery at checkout.",
      },
    },
    {
      "@type": "Question",
      name: "How does cookie delivery work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every box of The Everyday is baked to order on our Tuesday and Friday bake days, then delivered locally or handed to you at pickup — never shipped from a warehouse. Order by Sunday 11:59 PM for a Tuesday batch, or Wednesday 11:59 PM for a Friday batch.",
      },
    },
    {
      "@type": "Question",
      name: "How much do the cookies cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Everyday is $3.00 per cookie. You can order anywhere from 3 cookies up to a full 1,000-cookie event batch, all baked fresh to order.",
      },
    },
    {
      "@type": "Question",
      name: "Can I order cookies for a party, office, or event?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. For parties, offices, classrooms, weddings, and events, place an order for the quantity you need and we'll bake a dedicated fresh batch for your date. Order online at jacks-cookies.com.",
      },
    },
  ],
};

export default function CookieDeliveryRedBankNJ() {
  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <article className="subpage">
        <Link className="subpage-back" href="/">
          ← Back to Jack&apos;s Cookies
        </Link>
        <p className="public-kicker">Pickup &amp; Delivery</p>
        <h1>Cookie Delivery in Red Bank, NJ &amp; Monmouth County</h1>

        <p>
          Jack&apos;s Cookies delivers fresh-baked organic chocolate chip
          cookies across Monmouth County, New Jersey, with pickup in Red Bank.
          We&apos;re a home-based cottage bakery in Red Bank, NJ &mdash; every
          box of The Everyday is baked to order on our Tuesday and Friday bake
          days, then handed to you or driven to your door, never shipped from a
          warehouse.
        </p>
        <p>
          If you&apos;ve been searching for real, local cookie delivery near Red
          Bank &mdash; not a national chain or a gift-basket drop-shipper &mdash;
          this is it: one cookie, done right, baked the day it reaches you.
        </p>

        <h2>Pickup in Red Bank, NJ</h2>
        <p>
          Choose pickup at checkout and we&apos;ll confirm a Red Bank pickup
          time on your bake day. Order by Sunday 11:59&nbsp;PM for a Tuesday
          batch, or Wednesday 11:59&nbsp;PM for a Friday batch.
          {/* [OWNER: PICKUP-FREE — is Red Bank pickup free? If yes, add
              "Pickup is free." here. Not published until confirmed — pricing is
              an owner-only fact.] */}
        </p>

        <h2>Delivery across Monmouth County, NJ</h2>
        <p>
          We deliver locally throughout Monmouth County, NJ. Choose delivery at
          checkout and we&apos;ll confirm your delivery window and any fee after
          you place the order.
          {/* [OWNER: replace the sentence above once confirmed — "We deliver to
              [DELIVERY-TOWNS] on [DELIVERY-DAYS]. Delivery is [DELIVERY-FEE]."
              Do NOT publish a town list, a delivery day, or a fee until Julianna
              confirms each one.] */}
        </p>

        <h2>Cookies for parties, offices &amp; events</h2>
        <p>
          Ordering for a party, office, classroom, wedding, or event? Place an
          order for the quantity you need and we&apos;ll bake a dedicated fresh
          batch for your date. The Everyday is $3.00 per cookie, and you can
          order anywhere from 3 cookies up to a full 1,000-cookie batch.
        </p>

        <h2>Why order from Jack&apos;s Cookies</h2>
        <p>
          We make exactly one thing: The Everyday, an organic small-batch
          chocolate chip cookie with a hemp seed twist. It&apos;s baked fresh to
          order in Red Bank, NJ &mdash; so what arrives at your door was made
          for you, that week, in a home kitchen, not pulled off a shelf. You can
          read where the hemp came from in{" "}
          <Link href="/blog/the-everyday-story" className="inline-link">
            our origin-story post
          </Link>{" "}
          and find answers to common questions in{" "}
          <Link href="/faq" className="inline-link">
            our FAQ
          </Link>
          .
        </p>

        <p className="subpage-cta">
          Ready for cookies?{" "}
          <Link href="/#order" className="inline-link">
            Build your box and order The Everyday here
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
