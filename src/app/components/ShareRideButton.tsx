"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface ShareRideButtonProps {
  url: string;
  title: string;
  description?: string;
  align?: "left" | "right";
  label?: string;
}

type SocialPlatform = {
  name: string;
  href: (url: string, title: string) => string;
  icon: JSX.Element;
};

const socialPlatforms: SocialPlatform[] = [
  {
    name: "Facebook",
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9v-2.9h2.4V9.86c0-2.38 1.42-3.7 3.59-3.7 1.04 0 2.13.18 2.13.18v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.9h-2.22V22c4.78-.8 8.44-4.94 8.44-9.93Z" />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url,
      )}&text=${encodeURIComponent(title)}`,
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.98 3H18.7l-5.06 6.79L8.2 3H3.02l7.32 10.38L3.26 21h2.28l5.48-7.36L16 21h5.2l-7.56-10.73L20.98 3Z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: (url, title) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        url,
      )}&title=${encodeURIComponent(title)}`,
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.98h4.52V22H.24V8.98ZM8.46 8.98h4.33v1.78h.06c.6-1.13 2.07-2.32 4.27-2.32 4.57 0 5.41 3 5.41 6.9V22h-4.71v-6.44c0-1.54-.03-3.52-2.15-3.52-2.16 0-2.49 1.68-2.49 3.41V22H8.46V8.98Z" />
      </svg>
    ),
  },
];

export function ShareRideButton({
  url,
  title,
  description,
  align = "right",
  label = "Share",
}: ShareRideButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupportsNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch (error) {
      console.error("Failed to copy share url", error);
    }
  };

  const handleNativeShare = async () => {
    if (supportsNativeShare) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        setOpen(false);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          return;
        }
        console.warn("Native share failed, falling back to copy.", error);
      }
    }
    await handleCopy();
  };

  const menuAlignClass = useMemo(
    () => (align === "left" ? "left-0" : "right-0"),
    [align],
  );

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <img
            src="/share-svgrepo-com.svg"
            alt=""
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>
        {label}
      </button>

      {open && (
        <div
          className={`absolute ${menuAlignClass} z-40 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl`}
          role="menu"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Share this ride
          </p>
          <div className="mt-2 space-y-2">
            {supportsNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex w-full items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                  <path d="M16 6l-4-4-4 4" />
                  <path d="M12 2v14" />
                </svg>
                Share using device
              </button>
            )}

            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                {platform.icon}
                <span>{platform.name}</span>
              </a>
            ))}

            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? "Link copied!" : "Copy ride link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

