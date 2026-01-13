"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const thinkingPhrases = [
  "Thinking...",
  "Processing...",
  "Analyzing...",
  "Working on it...",
];

export function TypingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="group flex w-full gap-3 px-2 py-2 mt-4 animate-slide-up">
      {/* Avatar */}
      <div className="relative">
        <Image
          src="/sage-logo.png"
          alt="Sage"
          width={40}
          height={40}
          className="h-10 w-10 flex-shrink-0 object-contain"
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage-500 animate-glow-pulse" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-start">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <span className="text-sm font-semibold text-grey-900">Sage</span>
          <span className="text-xs text-sage-500 transition-opacity duration-300">
            {thinkingPhrases[phraseIndex]}
          </span>
        </div>

        {/* Typing bubble with shimmer */}
        <div className="rounded-2xl rounded-tl-lg bg-white px-5 py-4 shadow-md shadow-grey-200/50 ring-1 ring-grey-100">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sage-300 to-sage-500 animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sage-400 to-sage-600 animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sage-300 to-sage-500 animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
