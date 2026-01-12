"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            primary:
              "bg-sage-600 text-white hover:bg-sage-700 active:bg-sage-800",
            secondary:
              "bg-grey-100 text-grey-900 hover:bg-grey-200 active:bg-grey-300",
            ghost:
              "text-grey-600 hover:bg-grey-100 hover:text-grey-900 active:bg-grey-200",
          }[variant],
          {
            sm: "h-8 px-3 text-sm",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
