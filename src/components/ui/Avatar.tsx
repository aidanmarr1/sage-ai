"use client";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "busy";
}

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
  showStatus = false,
  status = "online",
}: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const statusSizeClasses = {
    sm: "h-2 w-2 -right-0.5 -bottom-0.5",
    md: "h-2.5 w-2.5 -right-0.5 -bottom-0.5",
    lg: "h-3 w-3 -right-0.5 -bottom-0.5",
    xl: "h-4 w-4 -right-1 -bottom-1",
  };

  const statusColors = {
    online: "bg-sage-500",
    offline: "bg-grey-400",
    busy: "bg-grey-500",
  };

  // Get initials from fallback string
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/25",
          sizeClasses[size]
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : fallback ? (
          <span className="text-sm font-semibold text-white">
            {getInitials(fallback)}
          </span>
        ) : (
          <User className="h-1/2 w-1/2 text-white" />
        )}
      </div>
      {showStatus && (
        <div
          className={cn(
            "absolute rounded-full border-2 border-white",
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

// Avatar group for showing multiple users
export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
}: {
  avatars: Array<{ src?: string; fallback?: string }>;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapClasses = {
    sm: "-ml-2",
    md: "-ml-3",
    lg: "-ml-4",
  };

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            "relative ring-2 ring-white rounded-full",
            index > 0 && overlapClasses[size]
          )}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            fallback={avatar.fallback}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-grey-200 text-grey-600 ring-2 ring-white",
            overlapClasses[size],
            size === "sm" ? "h-8 w-8 text-xs" : size === "md" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
