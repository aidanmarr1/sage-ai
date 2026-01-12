"use client";

import { cn } from "@/lib/cn";

interface PanelProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function Panel({
  title,
  icon,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: PanelProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {(title || actions) && (
        <div
          className={cn(
            "flex h-12 flex-shrink-0 items-center justify-between border-b border-grey-200 bg-white px-4",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-grey-500">{icon}</span>
            )}
            {title && (
              <h2 className="font-serif text-lg font-semibold text-grey-900">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("flex-1 overflow-hidden", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
