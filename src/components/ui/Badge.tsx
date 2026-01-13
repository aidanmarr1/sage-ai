"use client";

import { cn } from "@/lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "info" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const variantClasses = {
    default: "bg-sage-100 text-sage-700",
    success: "bg-sage-500 text-white",
    info: "bg-grey-100 text-grey-700",
    outline: "border border-grey-200 bg-white text-grey-600",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Notification dot badge
export function NotificationBadge({
  count,
  max = 99,
}: {
  count: number;
  max?: number;
}) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sage-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
      {displayCount}
    </span>
  );
}

// Pulsing notification indicator
export function PulsingDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
    </span>
  );
}

// Status badge
export function StatusBadge({
  status,
}: {
  status: "online" | "offline" | "busy" | "away";
}) {
  const statusColors = {
    online: "bg-sage-500",
    offline: "bg-grey-400",
    busy: "bg-grey-500",
    away: "bg-grey-400",
  };

  const statusLabels = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    away: "Away",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
      <span className="text-xs text-grey-500">{statusLabels[status]}</span>
    </div>
  );
}
