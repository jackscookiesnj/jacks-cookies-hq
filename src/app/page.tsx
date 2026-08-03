import Image from "next/image";
import { InstagramFeed } from "@/components/instagram-feed";
import { PublicOrderForm } from "@/components/public-order-form";

const instagramPostUrls = (process.env.NEXT_PUBLIC_INSTAGRAM_POST_URLS ?? "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const instagramElfsightAppId =
  process.env.NEXT_PUBLIC_INSTAGRAM_ELFSIGHT_APP_ID?.trim();
const instagramIframeUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_IFRAME_URL?.trim();

export const metadata = {
  alternates: { canonical: "https://jacks-cookies.com" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Bakery",
      "@id": "https://jacks-cookies.com/#bakery",
      name: "Jack's Cookies",
      url: "https://jacks-cookies.com",
      image: "https://jacks-cookies.com/brand/rebrand/full-lockup.webp",
      logo: "https://jacks-cookies.com/brand/rebrand/full-lockup.webp",
      description:
        "Home-based cottage bakery in Red Bank, NJ baking The Everyday — an organic small-batch chocolate chip cookie with a hemp seed twist. Baked fresh to order, with pickup, local delivery, and wholesale.",
      slogan: "The Everyday Chocolate Chip Cookie.",
      servesCuisine: "Bakery",
      priceRange: "$",
      email: "JacksCookiesNJ@gmail.com",
      telephone: "+1-646-899-5012",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Red Bank",
        addressRegion: "NJ",
        addressCountry: "US",
      },
      areaServed: [
        { "@type": "City", name: "Red Bank" },
        { "@type": "AdministrativeArea", name: "Monmouth County, NJ" },
      ],
      founder: {
        "@type": "Person",
        name: "Julianna Levine",
        jobTitle: "Founder & CEO",
      },
      sameAs: [
        "https://www.instagram.com/jackscookies",
        "https://www.tiktok.com/@jackscookiesnj",
      ],
      subjectOf: {
        "@type": "NewsArticle",
        headline: "Red Bank mom, son bake up 'quintessential chocolate chip cookie'",
        url: "https://www.aol.com/articles/red-bank-mom-son-bake-091549260.html",
        publisher: { "@type": "Organization", name: "Asbury Park Press" },
        datePublished: "2026-07-02",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://jacks-cookies.com/#website",
      url: "https://jacks-cookies.com",
      name: "Jack's Cookies",
      publisher: { "@id": "https://jacks-cookies.com/#bakery" },
    },
    {
      "@type": "Product",
      "@id": "https://jacks-cookies.com/#everyday",
      name: "The Everyday — Organic Chocolate Chip Cookie",
      image: "https://jacks-cookies.com/brand/rebrand/full-lockup.webp",
      description:
        "Organic small-batch chocolate chip cookie with a hemp seed twist, baked fresh to order in Red Bank, NJ. Order from 3 cookies up to 1,000 for events and wholesale.",
      brand: { "@type": "Brand", name: "Jack's Cookies" },
      offers: {
        "@type": "Offer",
        url: "https://jacks-cookies.com/#order",
        price: "3.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
  ],
};

export default function Home() {
  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section className="public-hero">
        <nav className="public-nav" aria-label="Main navigation">
          <div className="public-nav-links nav-left">
            <a href="#top">Home</a>
            <a href="#order">Order</a>
          </div>
          <a className="nav-wordmark" href="#top" aria-label="Jack's Cookies home">
            <Image
              src="/brand/rebrand/jc-mark.webp"
              alt="Jack's Cookies home"
              width={1683}
              height={1766}
              priority
            />
          </a>
          <div className="public-nav-links nav-right">
            <a href="#story">Our Story</a>
            <a href="#wholesale">Wholesale</a>
          </div>
          <details className="mobile-nav-menu">
            <summary aria-label="Open navigation">
              <span />
              <span />
              <span />
            </summary>
            <div className="mobile-nav-panel">
              <a href="#top">Home</a>
              <a href="#order">Order</a>
              <a href="#story">Our Story</a>
              <a href="#wholesale">Wholesale</a>
            </div>
          </details>
        </nav>

        <div className="public-hero-grid" id="top">
          <div className="public-hero-copy">
            <Image
              className="hero-logo"
              src="/brand/rebrand/full-lockup.webp"
              alt="Jack's Cookies"
              width={3057}
              height={3194}
              priority
            />
            <p>The Everyday Chocolate Chip Cookie.</p>
            <div className="public-actions">
              <a className="public-button primary" href="#order">
                Pre-Order Now
              </a>
              <a className="public-button" href="#event-order">
                Planning an Event?
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section order-section" id="order">
        <div className="section-heading">
          <h2 className="art-heading order-art-heading">
            <span>Your cookie jar looks empty.</span>
            <Image src="/brand/headlines/cookie-jar-clean-teal.png" alt="" width={1941} height={339} />
          </h2>
          <p>
            Pickup in Red Bank or local delivery in Monmouth County (for now!).
          </p>
        </div>
        <PublicOrderForm />
      </section>

      <div className="checker-divider" aria-hidden="true" />

      <section className="public-feature" id="story">
        <div className="story-feature-inner">
          <div className="story-photo">
            <Image
              src="/brand/jack-story-rebrand-v3.png"
              alt="Jack wearing the new Jack's Cookies branding"
              width={1086}
              height={1448}
            />
          </div>
          <div className="feature-copy">
            <h2 className="art-heading story-art-heading">
              <span>It Started With Jack</span>
              <Image src="/brand/headlines/story-clean-peach.png" alt="" width={1960} height={333} />
            </h2>
            <p>
              Jack&apos;s Cookies started with one goal: make one really great
              chocolate chip cookie. It all came together almost by accident.
            </p>
            <p>
              Jack and I have always loved baking together. One day, we started
              adding organic hemp seeds to our cookies to give him a little
              extra nutrition. What we didn&apos;t expect was how much they
              transformed the cookie itself.
            </p>
            <p>
              They added a subtle nuttiness, a richer flavor, and a texture we
              couldn&apos;t stop thinking about. That was the cookie.
            </p>
            <p>
              We named the business after Jack, my baking partner, first
              official taste tester, and still one of our toughest critics.
            </p>
            <p>
              Today, we bake that same cookie in small batches right here in Red
              Bank, New Jersey. Just one chocolate chip cookie, made with
              organic ingredients and an obsession with getting it right.
            </p>
          </div>
        </div>
      </section>

      <div className="checker-divider reverse" aria-hidden="true" />

      <section className="public-section instagram-section" aria-label="Instagram">
        <div className="section-heading instagram-heading">
          <div>
            <h2 className="art-heading instagram-art-heading">
              <span>@jackscookies</span>
              <Image src="/brand/headlines/instagram-solid-teal.png" alt="" width={1852} height={457} />
            </h2>
          </div>
          <a
            className="public-button primary"
            href="https://www.instagram.com/jackscookies/"
            target="_blank"
            rel="noreferrer"
          >
            Open Instagram
          </a>
        </div>
        <InstagramFeed
          elfsightAppId={instagramElfsightAppId}
          iframeUrl={instagramIframeUrl}
          postUrls={instagramPostUrls}
        />
      </section>

      <div className="checker-divider" aria-hidden="true" />

      <section className="public-feature wholesale-feature" id="wholesale">
        <div className="feature-copy wholesale-copy">
          <div>
            <h2 className="art-heading wholesale-art-heading">
              <span>Carry Jack&apos;s Cookies</span>
              <Image src="/brand/headlines/wholesale-clean-peach.png" alt="" width={1940} height={374} />
            </h2>
            <p>
              One dependable chocolate chip cookie your customers will come back
              for.
            </p>
            <p>
              Baked in small batches in Red Bank with organic ingredients and
              hemp seeds that add a subtle nuttiness and signature texture. A
              delicious fit for cafés, markets, offices, hospitality partners,
              corporate gifts, and special events.
            </p>
          </div>
          <div className="wholesale-actions">
            <a
              className="public-button primary"
              href="mailto:JacksCookiesNJ@gmail.com?subject=Wholesale%20inquiry%20for%20Jack's%20Cookies"
            >
              Wholesale Inquiries
            </a>
            <em>JacksCookiesNJ@gmail.com</em>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <div className="footer-contact">
          <a href="mailto:JacksCookiesNJ@gmail.com">Contact</a>
          <a href="tel:+16468995012">646-899-5012</a>
        </div>
        <div className="footer-brand">
          <Image
            className="footer-logo"
            src="/brand/rebrand/full-lockup.webp"
            alt="Jack's Cookies"
            width={3057}
            height={3194}
          />
          <p>One cookie. Done right.</p>
          <span>Made fresh in Red Bank, New Jersey.</span>
        </div>
        <div className="footer-socials" aria-label="Jack's Cookies social links">
          <a
            href="https://www.instagram.com/jackscookies/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@jackscookiesnj"
            target="_blank"
            rel="noreferrer"
          >
            TikTok
          </a>
        </div>
      </footer>
    </main>
  );
}
