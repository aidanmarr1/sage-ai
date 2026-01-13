"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "shimmer" | "none";
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "shimmer",
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-grey-200",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        variant === "text" && "rounded",
        animation === "pulse" && "animate-pulse",
        animation === "shimmer" && "animate-shimmer",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

// Pre-made skeleton patterns
export function SkeletonMessage() {
  return (
    <div className="flex gap-3 px-2 py-2">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton width="30%" height={16} />
        <Skeleton width="80%" height={48} className="rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-grey-200 bg-white p-4">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonSearchResult() {
  return (
    <div className="rounded-lg border border-grey-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <Skeleton variant="rectangular" width={24} height={24} className="rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton width="75%" height={14} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="30%" height={10} />
        </div>
      </div>
    </div>
  );
}
