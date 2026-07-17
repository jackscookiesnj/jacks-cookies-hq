import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jacks-cookies.com"),
  title: {
    default: "Jack's Cookies — Organic Chocolate Chip Cookies in Red Bank, NJ",
    template: "%s — Jack's Cookies",
  },
  description:
    "Organic small-batch chocolate chip cookies with a hemp seed twist, baked fresh to order in Red Bank, New Jersey. $3 a cookie, pickup or local delivery, wholesale available.",
  keywords: [
    "chocolate chip cookies Red Bank NJ",
    "organic cookies New Jersey",
    "cookie delivery Red Bank",
    "hemp seed cookies",
    "Jack's Cookies Red Bank",
  ],
  openGraph: {
    title: "Jack's Cookies — Organic Chocolate Chip Cookies in Red Bank, NJ",
    description:
      "The Everyday: an organic small-batch chocolate chip cookie with a hemp seed twist, baked fresh to order in Red Bank, NJ. Pickup, local delivery, and wholesale.",
    url: "https://jacks-cookies.com",
    siteName: "Jack's Cookies",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Jack's Cookies — retro cookie mascot and wordmark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jack's Cookies — Organic Chocolate Chip Cookies in Red Bank, NJ",
    description:
      "The Everyday: an organic small-batch chocolate chip cookie with a hemp seed twist, baked fresh to order in Red Bank, NJ.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
