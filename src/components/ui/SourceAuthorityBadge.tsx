"use client";

import { cn } from "@/lib/cn";
import type { SourceAuthority } from "@/lib/source-quality";
import { Shield, ShieldCheck, ShieldAlert, ShieldQuestion, Info } from "lucide-react";
import { useState } from "react";

interface SourceAuthorityBadgeProps {
  authority?: SourceAuthority;
  showScore?: boolean;
  showCategory?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SourceAuthorityBadge({
  authority,
  showScore = false,
  showCategory = false,
  size = "sm",
  className,
}: SourceAuthorityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!authority) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-grey-100 text-grey-500",
          size === "sm" && "px-1.5 py-0.5 text-xs",
          size === "md" && "px-2 py-1 text-xs",
          size === "lg" && "px-2.5 py-1 text-sm",
          className
        )}
      >
        <ShieldQuestion className={cn(
          size === "sm" && "h-3 w-3",
          size === "md" && "h-3.5 w-3.5",
          size === "lg" && "h-4 w-4"
        )} />
        <span>Unknown</span>
      </span>
    );
  }

  const tierConfig = {
    high: {
      icon: ShieldCheck,
      label: "High",
      bg: "bg-sage-100",
      text: "text-sage-700",
      border: "border-sage-200",
    },
    medium: {
      icon: Shield,
      label: "Medium",
      bg: "bg-grey-100",
      text: "text-grey-600",
      border: "border-grey-200",
    },
    low: {
      icon: ShieldAlert,
      label: "Low",
      bg: "bg-grey-50",
      text: "text-grey-500",
      border: "border-grey-200",
    },
    unknown: {
      icon: ShieldQuestion,
      label: "Unknown",
      bg: "bg-grey-100",
      text: "text-grey-500",
      border: "border-grey-200",
    },
  };

  const config = tierConfig[authority.tier];
  const Icon = config.icon;

  const categoryLabels: Record<string, string> = {
    academic: "Academic",
    news_major: "Major News",
    news_regional: "Regional News",
    government: "Government",
    reference: "Reference",
    tech: "Tech",
    blog: "Blog",
    social: "Social",
    commercial: "Commercial",
    unknown: "Unknown",
  };

  return (
    <div className="relative inline-flex">
      <button
        className={cn(
          "inline-flex items-center gap-1 rounded-full border transition-colors",
          config.bg,
          config.text,
          config.border,
          size === "sm" && "px-1.5 py-0.5 text-xs",
          size === "md" && "px-2 py-1 text-xs",
          size === "lg" && "px-2.5 py-1 text-sm",
          "hover:opacity-80 cursor-help",
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon
          className={cn(
            size === "sm" && "h-3 w-3",
            size === "md" && "h-3.5 w-3.5",
            size === "lg" && "h-4 w-4"
          )}
        />
        <span>{config.label}</span>
        {showScore && <span className="opacity-70">({authority.score})</span>}
        {showCategory && authority.category !== "unknown" && (
          <span className="opacity-70">· {categoryLabels[authority.category]}</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in-up">
          <div className="rounded-lg border border-grey-200 bg-white p-3 shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-4 w-4", config.text)} />
              <span className="font-medium text-grey-900">{config.label} Authority</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-grey-500">Score</span>
                <span className="font-medium text-grey-700">{authority.score}/100</span>
              </div>

              <div className="flex justify-between">
                <span className="text-grey-500">Category</span>
                <span className="font-medium text-grey-700">{categoryLabels[authority.category]}</span>
              </div>

              {authority.flags.length > 0 && (
                <div className="pt-1.5 border-t border-grey-100">
                  <span className="text-grey-500">Flags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {authority.flags.map((flag) => (
                      <span
                        key={flag}
                        className="inline-flex items-center rounded-full bg-grey-100 px-1.5 py-0.5 text-grey-600"
                      >
                        {flag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1.5 border-t border-grey-100">
                <p className="text-grey-500 leading-relaxed">
                  {authority.tier === "high" && "Highly trustworthy source. Good for critical facts."}
                  {authority.tier === "medium" && "Generally reliable. Consider corroboration for key claims."}
                  {authority.tier === "low" && "Use with caution. Verify important information elsewhere."}
                  {authority.tier === "unknown" && "Unknown source quality. Research the source before relying on it."}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-grey-200 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline authority indicator
 */
export function AuthorityIndicator({
  authority,
  className,
}: {
  authority?: SourceAuthority;
  className?: string;
}) {
  if (!authority) return null;

  const colors = {
    high: "bg-sage-500",
    medium: "bg-grey-400",
    low: "bg-grey-300",
    unknown: "bg-grey-200",
  };

  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colors[authority.tier],
        className
      )}
      title={`${authority.tier} authority (${authority.score})`}
    />
  );
}
