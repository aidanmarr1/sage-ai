"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface ResizeHandleProps {
  orientation: "vertical" | "horizontal";
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizeHandle({
  orientation,
  onResize,
  className,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const onResizeRef = useRef(onResize);
  const lastPositionRef = useRef(0);

  // Keep the callback ref updated
  onResizeRef.current = onResize;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    lastPositionRef.current = orientation === "vertical" ? e.clientX : e.clientY;
    setIsDragging(true);
  }, [orientation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPosition =
        orientation === "vertical" ? e.clientX : e.clientY;

      const delta = currentPosition - lastPositionRef.current;
      const containerSize =
        orientation === "vertical" ? window.innerWidth : window.innerHeight;
      const deltaPercent = (delta / containerSize) * 100;

      onResizeRef.current(deltaPercent);
      lastPositionRef.current = currentPosition;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, orientation]);

  return (
    <div
      className={cn(
        "group relative flex items-center justify-center",
        orientation === "vertical"
          ? "w-1.5 cursor-col-resize hover:bg-sage-200/50"
          : "h-1.5 cursor-row-resize hover:bg-sage-200/50",
        isDragging && "bg-sage-300",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Wider invisible hit area for easier grabbing */}
      <div
        className={cn(
          "absolute",
          orientation === "vertical" ? "inset-y-0 -left-1 -right-1" : "inset-x-0 -top-1 -bottom-1"
        )}
      />
      <div
        className={cn(
          "absolute rounded-full bg-grey-300 opacity-0 group-hover:opacity-100",
          isDragging && "opacity-100 bg-sage-500",
          orientation === "vertical" ? "h-8 w-1" : "h-1 w-8"
        )}
      />
    </div>
  );
}
