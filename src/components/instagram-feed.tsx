"use client";

import Script from "next/script";
import { useEffect } from "react";

type InstagramFeedProps = {
  elfsightAppId?: string;
  iframeUrl?: string;
  postUrls: string[];
};

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: () => void;
      };
    };
  }
}

export function InstagramFeed({
  elfsightAppId,
  iframeUrl,
  postUrls,
}: InstagramFeedProps) {
  useEffect(() => {
    window.instgrm?.Embeds?.process();
  }, [postUrls]);

  if (elfsightAppId) {
    return (
      <>
        <Script
          src="https://elfsightcdn.com/platform.js"
          strategy="lazyOnload"
        />
        <div className="instagram-widget-shell">
          <div className={elfsightAppId} data-elfsight-app-lazy />
        </div>
      </>
    );
  }

  if (iframeUrl) {
    return (
      <div className="instagram-widget-shell">
        <iframe
          className="instagram-widget-frame"
          src={iframeUrl}
          title="Jack's Cookies Instagram feed"
          loading="lazy"
        />
      </div>
    );
  }

  if (postUrls.length === 0) {
    return (
      <div className="instagram-empty">
        <p>Want the latest bakes, cookie cart days, and behind-the-scenes?</p>
        <a
          className="public-button primary"
          href="https://www.instagram.com/jackscookies/"
          target="_blank"
          rel="noreferrer"
        >
          Follow @jackscookies
        </a>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => window.instgrm?.Embeds?.process()}
      />
      <div className="instagram-embed-grid">
        {postUrls.map((url) => (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            key={url}
          >
            <a href={url} target="_blank" rel="noreferrer">
              View this post on Instagram
            </a>
          </blockquote>
        ))}
      </div>
    </>
  );
}
