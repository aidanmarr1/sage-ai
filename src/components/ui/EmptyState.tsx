"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  features,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50",
        className
      )}
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
      </div>

      <div className="relative flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="group relative mb-6">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 to-sage-300/30 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/25 transition-all duration-500 group-hover:scale-105">
              <Icon className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Text */}
          <h3 className="font-serif text-2xl font-semibold text-grey-900">
            {title}
          </h3>
          <p className="mt-2 max-w-xs text-sm text-grey-500">{description}</p>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-grey-200 bg-white px-3 py-1.5 text-xs font-medium text-grey-500 shadow-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* Action */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-8 flex items-center gap-2 rounded-full bg-sage-500 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-sage-500/20 transition-all hover:bg-sage-600 hover:shadow-lg active:scale-95"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
