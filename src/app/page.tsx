import Image from "next/image";
import Link from "next/link";
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
      image: "https://jacks-cookies.com/og.jpg",
      logo: "https://jacks-cookies.com/brand/jacks-cookies-logo.png",
      description:
        "Home-based cottage bakery in Red Bank, NJ baking The Everyday — an organic small-batch chocolate chip cookie with a hemp seed twist. Baked fresh to order, with pickup, local delivery, and wholesale.",
      slogan: "Bringing back the timeless, quintessential chocolate chip cookie.",
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
      image: "https://jacks-cookies.com/og.jpg",
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
              src="/brand/jacks-nav-wordmark.png"
              alt="Jack's Cookies"
              width={1097}
              height={722}
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
            <div className="star-cluster hero-copy-cluster left" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <h1>One Cookie. Done Right.</h1>
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
          <div className="mascot-pop hero-mascot-pop" aria-hidden="true">
            <Image
              src="/brand/cookie-mascot.png"
              alt=""
              width={1024}
              height={1024}
            />
            <div className="star-cluster mascot-star-cluster">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>

      <section className="order-strip" aria-label="Quick ordering details">
        <article>
          <span>01</span>
          <strong>Tuesday or Friday</strong>
          <p>Choose your pickup or delivery day.</p>
        </article>
        <article>
          <span>02</span>
          <strong>$3 each</strong>
          <p>Choose your cookie count.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Pickup or delivery</strong>
          <p>Pickup in Red Bank or local delivery in Monmouth County (for now!).</p>
        </article>
      </section>

      <section className="public-section order-section" id="order">
        <div className="section-heading">
          <p className="public-kicker">Order The Everyday</p>
          <h2>Your cookie jar looks empty.</h2>
          <p>
            Baked fresh Tuesday and Friday for pickup or local delivery.
          </p>
        </div>
        <PublicOrderForm />
      </section>

      <section className="public-feature" id="story">
        <div className="story-feature-inner">
          <div className="star-cluster story-photo-cluster" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="story-photo">
            <Image
              src="/brand/jack-story.jpg.webp"
              alt="Jack holding a Jack's Cookies cookie menu sign"
              width={1320}
              height={880}
            />
          </div>
          <div className="feature-copy">
            <p className="public-kicker">Our Story</p>
            <h2>It Started With Jack</h2>
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

      <section className="public-section instagram-section" aria-label="Instagram">
        <div className="section-heading instagram-heading">
          <div>
            <p className="public-kicker">Follow Along</p>
            <h2>@jackscookies</h2>
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

      <section className="public-feature wholesale-feature" id="wholesale">
        <div className="star-cluster wholesale-cluster" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="feature-copy wholesale-copy">
          <div>
            <p className="public-kicker">Wholesale</p>
            <h2>Carry Jack&apos;s Cookies</h2>
            <p>
              One dependable chocolate chip cookie your customers will come back
              for.
            </p>
          </div>
          <div className="wholesale-actions">
            <a
              className="public-button primary"
              href="mailto:JacksCookiesNJ@gmail.com?subject=Wholesale%20inquiry%20for%20Jack's%20Cookies"
            >
              Email About Wholesale
            </a>
            <em>JacksCookiesNJ@gmail.com</em>
          </div>
        </div>
      </section>

      <section className="public-section" id="more" aria-label="More from Jack's Cookies">
        <div className="section-heading">
          <p className="public-kicker">More From Jack&apos;s Cookies</p>
          <h2>Delivery, Questions &amp; the Journal</h2>
          <p>
            Jack&apos;s Cookies is a home-based cottage bakery in Red Bank, New
            Jersey, in Monmouth County. These pages cover how pickup and local
            delivery work, the questions we get asked most, and the story behind
            The Everyday.
          </p>
        </div>
        <ul className="more-links">
          <li>
            <Link href="/cookie-delivery-red-bank-nj">
              Cookie delivery in Red Bank, NJ &amp; Monmouth County
            </Link>
            <span>
              How pickup in Red Bank and local delivery across Monmouth County
              work, our bake days, and ordering for events.
            </span>
          </li>
          <li>
            <Link href="/faq">
              Frequently asked questions about ordering
            </Link>
            <span>
              Where we are, what a cookie costs, how many you can order,
              delivery, wholesale, hemp seeds, and how to tell us apart from
              similarly named bakeries in other states.
            </span>
          </li>
          <li>
            <Link href="/blog/the-everyday-story">
              How hemp seeds created The Everyday
            </Link>
            <span>
              The origin story of our one cookie, written by founder Julianna
              Levine.
            </span>
          </li>
          <li>
            <Link href="/blog/do-hemp-seed-cookies-get-you-high">
              Do hemp seed cookies get you high? (No)
            </Link>
            <span>
              Why the culinary hemp seeds in our chocolate chip cookies are a
              food, not a drug.
            </span>
          </li>
          <li>
            <Link href="/blog/what-makes-a-chocolate-chip-cookie-organic">
              What makes a chocolate chip cookie organic?
            </Link>
            <span>
              What the word actually means on an ingredient list, and what we
              look for when we buy.
            </span>
          </li>
        </ul>
      </section>

      <footer className="public-footer">
        <div className="footer-contact">
          <a href="mailto:JacksCookiesNJ@gmail.com">Contact</a>
          <a href="tel:+16468995012">646-899-5012</a>
        </div>
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
