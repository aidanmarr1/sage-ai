"use client";

import { cn } from "@/lib/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-sage-200 border-t-sage-500",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Full-page loading state
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-sage-100/50 blur-xl animate-pulse" />
          <LoadingSpinner size="lg" />
        </div>
        {message && (
          <p className="mt-4 text-sm text-grey-500 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

// Inline loading state
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-grey-500">{message}</span>}
    </div>
  );
}

// Dots loading animation
export function DotsLoader() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-sage-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
