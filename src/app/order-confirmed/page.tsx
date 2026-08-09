import Link from "next/link";

export const metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <main className="checkout-confirmation">
      <section>
        <p className="eyebrow">Thank you</p>
        <h1>Your cookie order is in!</h1>
        <p>
          Square will email your payment receipt. We&apos;ll follow up with your pickup or delivery details.
        </p>
        <Link className="public-button primary" href="/">
          Back to Jack&apos;s Cookies
        </Link>
      </section>
    </main>
  );
}
