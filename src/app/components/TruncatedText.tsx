"use client";

import { useState, useMemo } from "react";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
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

  if (!shouldTruncate) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div>
      <p className={className}>
        {displayText}
        {!isExpanded && "..."}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded transition-colors"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

