"use client";

import Image from "next/image";

export function TypingIndicator() {
  return (
    <div className="group flex w-full gap-3 px-2 py-2 mt-4 animate-fade-in">
      {/* Avatar */}
      <div className="relative">
        <Image
          src="/sage-logo.png"
          alt="Sage"
          width={40}
          height={40}
          className="h-10 w-10 flex-shrink-0 object-contain"
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage-500" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-start">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <span className="text-sm font-semibold text-grey-900">Sage</span>
          <span className="text-xs text-sage-500">is thinking...</span>
        </div>

        {/* Typing bubble */}
        <div className="rounded-2xl rounded-tl-lg bg-white px-5 py-4 shadow-md shadow-grey-200/50 ring-1 ring-grey-100">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sage-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2.5 w-2.5 rounded-full bg-sage-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2.5 w-2.5 rounded-full bg-sage-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
