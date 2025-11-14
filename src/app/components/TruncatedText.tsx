"use client";

import { useState, useMemo, ReactElement } from "react";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

// URL regex pattern - matches http, https, and common URL patterns
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

// Function to parse text and convert URLs to clickable links
function parseTextWithLinks(text: string): (string | ReactElement)[] {
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Process the URL
    let url = match[0];
    let href = url;

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.startsWith("www.")) {
        href = `https://${url}`;
      } else {
        href = `https://${url}`;
      }
    }

    // Create link element
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 hover:text-emerald-700 underline break-all"
      >
        {url}
      </a>
    );

    lastIndex = URL_REGEX.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  // If no URLs found, return the original text
  return parts.length > 0 ? parts : [text];
}

export function TruncatedText({ text, maxLength = 200, className = "" }: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = text.length > maxLength;
  const displayText = useMemo(() => {
    if (!shouldTruncate || isExpanded) {
      return text;
    }
    return text.slice(0, maxLength);
  }, [text, maxLength, shouldTruncate, isExpanded]);

  const parsedContent = useMemo(() => {
    return parseTextWithLinks(displayText);
  }, [displayText]);

  const content = (
    <p className={`${className} break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {parsedContent}
      {!isExpanded && shouldTruncate && "..."}
    </p>
  );

  if (!shouldTruncate) {
    return content;
  }

  return (
    <div className="w-full min-w-0">
      {content}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded transition-colors"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

