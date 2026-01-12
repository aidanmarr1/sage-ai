"use client";

import { Monitor } from "lucide-react";

export function ComputerPanel() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
      </div>

      {/* Desktop Area */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          {/* Animated logo */}
          <div className="group relative mb-6">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 to-sage-300/30 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/25 transition-all duration-500 group-hover:scale-105 group-hover:shadow-sage-500/40">
              <Monitor className="h-12 w-12 text-white" />
            </div>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-grey-900">
            Agent Desktop
          </h3>
          <p className="mt-2 max-w-xs text-sm text-grey-500">
            Visual workspace coming soon. This is where you&apos;ll see the agent interact with your computer.
          </p>

          {/* Feature hints */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["Screen sharing", "Visual feedback", "Live preview"].map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-grey-200 bg-white px-3 py-1.5 text-xs font-medium text-grey-500 shadow-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Taskbar */}
      <div className="relative flex h-12 items-center justify-between border-t border-grey-200 bg-white px-4">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />

        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-500"></span>
          </div>
          <span className="text-xs font-medium text-grey-600">Ready</span>
        </div>

        <span className="rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
          sage-ai
        </span>
      </div>
    </div>
  );
}
