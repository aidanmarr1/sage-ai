"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { ExternalLink, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { getSourceAuthority, type SourceAuthority } from "@/lib/source-quality";

interface CitationTooltipProps {
  url: string;
  text: string;
  className?: string;
}

export function CitationTooltip({ url, text, className }: CitationTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [authority, setAuthority] = useState<SourceAuthority | null>(null);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
    if (!authority) {
      const auth = getSourceAuthority(url);
      setAuthority(auth);
    }
  }, [url, authority]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const getHostname = () => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url.substring(0, 30);
    }
  };

  const TierIcon = authority?.tier === "high" ? ShieldCheck :
    authority?.tier === "medium" ? Shield : ShieldAlert;

  const tierColors = {
    high: "text-sage-600",
    medium: "text-grey-500",
    low: "text-grey-400",
    unknown: "text-grey-400",
  };

  return (
    <span className="relative inline-block">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-sage-600 hover:text-sage-700 underline underline-offset-2 transition-colors",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </a>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fade-in-up"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="min-w-[250px] max-w-[350px] rounded-lg border border-grey-200 bg-white p-3 shadow-lg">
            {/* Header with authority */}
            <div className="flex items-center gap-2 mb-2">
              {authority && (
                <TierIcon className={cn("h-4 w-4 flex-shrink-0", tierColors[authority.tier])} />
              )}
              <span className="font-medium text-grey-900 text-sm truncate">
                {getHostname()}
              </span>
              {authority && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  authority.tier === "high" ? "bg-sage-100 text-sage-700" :
                  authority.tier === "medium" ? "bg-grey-100 text-grey-600" :
                  "bg-grey-100 text-grey-500"
                )}>
                  {authority.tier}
                </span>
              )}
            </div>

            {/* URL preview */}
            <p className="text-xs text-grey-500 truncate mb-2">
              {url}
            </p>

            {/* Authority details */}
            {authority && (
              <div className="space-y-1 text-xs border-t border-grey-100 pt-2">
                <div className="flex justify-between">
                  <span className="text-grey-500">Authority Score</span>
                  <span className="font-medium text-grey-700">{authority.score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-500">Category</span>
                  <span className="font-medium text-grey-700 capitalize">
                    {authority.category.replace(/_/g, " ")}
                  </span>
                </div>
                {authority.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {authority.flags.map((flag) => (
                      <span
                        key={flag}
                        className="inline-flex rounded-full bg-grey-100 px-1.5 py-0.5 text-grey-600"
                      >
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Open link button */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 w-full px-3 py-1.5 text-xs font-medium text-sage-600 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open Source
            </a>

            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-grey-200 rotate-45" />
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Parse markdown links and wrap them with CitationTooltip
 */
export function renderWithCitationTooltips(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the link with tooltip
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <CitationTooltip key={match.index} url={linkUrl} text={linkText} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
