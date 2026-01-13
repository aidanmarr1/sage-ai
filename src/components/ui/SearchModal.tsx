"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MessageSquare, FileText, Star, ArrowRight, Command } from "lucide-react";
import { cn } from "@/lib/cn";
import { useConversationStore } from "@/stores/conversationStore";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { conversations } = useConversationStore();

  // Filter conversations based on query
  const filteredConversations = useMemo(() => {
    if (!query.trim()) {
      return conversations.slice(0, 5);
    }
    const lowerQuery = query.toLowerCase();
    return conversations
      .filter((conv) => conv.title.toLowerCase().includes(lowerQuery))
      .slice(0, 8);
  }, [query, conversations]);

  // Quick actions
  const quickActions = [
    { id: "new", label: "New Task", icon: MessageSquare, shortcut: "⌘N" },
    { id: "settings", label: "Settings", icon: FileText, shortcut: "⌘," },
  ];

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = filteredConversations.length + quickActions.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(selectedIndex);
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredConversations.length, onClose]);

  const handleSelect = (index: number) => {
    if (index < filteredConversations.length) {
      const conv = filteredConversations[index];
      router.push(`/task/${conv.id}`);
    } else {
      const actionIndex = index - filteredConversations.length;
      const action = quickActions[actionIndex];
      if (action.id === "new") {
        router.push("/");
      } else if (action.id === "settings") {
        router.push("/settings");
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-grey-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl animate-scale-in rounded-2xl bg-white shadow-2xl ring-1 ring-grey-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-grey-100 px-4 py-3">
          <Search className="h-5 w-5 text-grey-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tasks, actions..."
            className="flex-1 bg-transparent text-grey-900 placeholder:text-grey-400 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 rounded-lg bg-grey-100 px-2 py-1 text-xs text-grey-500">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 hover:bg-grey-100 hover:text-grey-600 sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {/* Conversations */}
          {filteredConversations.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-grey-400">
                {query ? "Results" : "Recent Tasks"}
              </p>
              {filteredConversations.map((conv, index) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-sage-50 text-sage-900"
                      : "text-grey-700 hover:bg-grey-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      conv.starred ? "bg-sage-100" : "bg-grey-100"
                    )}
                  >
                    {conv.starred ? (
                      <Star className="h-4 w-4 fill-sage-500 text-sage-500" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-grey-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{conv.title}</p>
                  </div>
                  {selectedIndex === index && (
                    <ArrowRight className="h-4 w-4 text-sage-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-grey-400">
              Quick Actions
            </p>
            {quickActions.map((action, idx) => {
              const index = filteredConversations.length + idx;
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSelect(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-sage-50 text-sage-900"
                      : "text-grey-700 hover:bg-grey-50"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-grey-100">
                    <Icon className="h-4 w-4 text-grey-500" />
                  </div>
                  <span className="flex-1 font-medium">{action.label}</span>
                  <kbd className="rounded-lg bg-grey-100 px-2 py-1 text-xs text-grey-500">
                    {action.shortcut}
                  </kbd>
                </button>
              );
            })}
          </div>

          {/* No results */}
          {query && filteredConversations.length === 0 && (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-grey-300" />
              <p className="text-grey-500">No results for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-grey-100 px-4 py-2 text-xs text-grey-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />K to search
          </span>
        </div>
      </div>
    </div>
  );
}
