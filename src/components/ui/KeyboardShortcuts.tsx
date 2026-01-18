"use client";

import { useState, useEffect } from "react";
import { X, Command, Keyboard } from "lucide-react";
import { cn } from "@/lib/cn";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open search" },
      { keys: ["⌘", "/"], description: "Toggle shortcuts help" },
      { keys: ["Esc"], description: "Close modal / Cancel" },
    ],
  },
  {
    title: "Chat",
    shortcuts: [
      { keys: ["Enter"], description: "Send message" },
      { keys: ["Shift", "Enter"], description: "New line" },
      { keys: ["⌘", "V"], description: "Paste image" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "1"], description: "Go to Chat" },
      { keys: ["⌘", "2"], description: "Go to Plan" },
      { keys: ["⌘", "3"], description: "Go to Findings" },
      { keys: ["⌘", "N"], description: "New conversation" },
    ],
  },
  {
    title: "Plan",
    shortcuts: [
      { keys: ["⌘", "Enter"], description: "Execute plan" },
      { keys: ["⌘", "S"], description: "Save changes" },
    ],
  },
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘ + / to toggle shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-grey-900/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-grey-200 bg-white shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-grey-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
              <Keyboard className="h-5 w-5 text-sage-600" />
            </div>
            <div>
              <h2 className="font-semibold text-grey-900">Keyboard Shortcuts</h2>
              <p className="text-xs text-grey-500">Speed up your workflow</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 hover:bg-grey-100 hover:text-grey-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-grey-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-grey-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            {keyIndex > 0 && (
                              <span className="mx-1 text-grey-300">+</span>
                            )}
                            <kbd className="min-w-[28px] inline-flex items-center justify-center rounded-lg bg-grey-100 px-2 py-1 font-mono text-xs font-medium text-grey-600 shadow-sm ring-1 ring-grey-200">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-grey-100 bg-grey-50 px-6 py-3 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-grey-500">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white ring-1 ring-grey-200 font-mono">⌘ /</kbd> to toggle</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white ring-1 ring-grey-200 font-mono">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Small button to trigger keyboard shortcuts modal
 */
export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-grey-600 hover:bg-grey-100 transition-colors"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-grey-100 px-1.5 py-0.5 font-mono text-[10px] text-grey-500">
          <Command className="h-2.5 w-2.5" />/
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-grey-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-grey-200 bg-white shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-grey-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                  <Keyboard className="h-5 w-5 text-sage-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-grey-900">Keyboard Shortcuts</h2>
                  <p className="text-xs text-grey-500">Speed up your workflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 hover:bg-grey-100 hover:text-grey-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="space-y-6">
                {shortcutGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold text-grey-400 uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-grey-700">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center">
                                {keyIndex > 0 && (
                                  <span className="mx-1 text-grey-300">+</span>
                                )}
                                <kbd className="min-w-[28px] inline-flex items-center justify-center rounded-lg bg-grey-100 px-2 py-1 font-mono text-xs font-medium text-grey-600 shadow-sm ring-1 ring-grey-200">
                                  {key}
                                </kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-grey-100 bg-grey-50 px-6 py-3 rounded-b-2xl">
              <div className="flex items-center justify-between text-xs text-grey-500">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white ring-1 ring-grey-200 font-mono">⌘ /</kbd> to toggle</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white ring-1 ring-grey-200 font-mono">Esc</kbd> to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
