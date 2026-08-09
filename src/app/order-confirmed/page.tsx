import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <main className="checkout-confirmation">
      <section>
        <Image
          className="confirmation-logo"
          src="/brand/rebrand/full-lockup.png"
          alt="Jack's Cookies"
          width={1600}
          height={1600}
          priority
        />
        <p className="confirmation-kicker">Thank you!</p>
        <h1>Your cookie order is in!</h1>
        <div className="confirmation-details">
          <strong>Payment received.</strong>
          <p>
            We&apos;ll email your Jack&apos;s Cookies confirmation and follow up with pickup or delivery
            details. Square will send your payment receipt separately.
          </p>
        </div>
        <Link className="public-button primary" href="/">
          Back to Jack&apos;s Cookies
        </Link>
      </section>
    </main>
  );
}
