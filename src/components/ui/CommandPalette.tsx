"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  Search,
  Plus,
  Settings,
  HelpCircle,
  Home,
  History,
  Keyboard,
  Moon,
  LogOut,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSearchStore } from "@/stores/searchStore";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string[];
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { setCurrentConversation } = useConversationStore();
  const { clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();
  const { openSearch } = useSearchStore();

  const handleNewTask = useCallback(() => {
    setCurrentConversation(null);
    clearMessages();
    clearPlan();
    router.push("/");
    onClose();
  }, [setCurrentConversation, clearMessages, clearPlan, router, onClose]);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "new-task",
        label: "New Task",
        description: "Start a new conversation with Sage",
        icon: Plus,
        shortcut: ["⌘", "N"],
        category: "Actions",
        action: handleNewTask,
      },
      {
        id: "search",
        label: "Search Tasks",
        description: "Search through your conversations",
        icon: Search,
        shortcut: ["⌘", "K"],
        category: "Actions",
        action: () => {
          onClose();
          openSearch();
        },
      },
      {
        id: "toggle-sidebar",
        label: "Toggle Sidebar",
        description: "Show or hide the sidebar",
        icon: Command,
        shortcut: ["⌘", "B"],
        category: "View",
        action: () => {
          toggleSidebar();
          onClose();
        },
      },
      {
        id: "home",
        label: "Go to Home",
        description: "Return to the home screen",
        icon: Home,
        category: "Navigation",
        action: () => {
          router.push("/");
          onClose();
        },
      },
      {
        id: "settings",
        label: "Settings",
        description: "Manage your preferences",
        icon: Settings,
        shortcut: ["⌘", ","],
        category: "Navigation",
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
      {
        id: "help",
        label: "Help & Support",
        description: "View help documentation",
        icon: HelpCircle,
        shortcut: ["?"],
        category: "Navigation",
        action: () => {
          router.push("/help");
          onClose();
        },
      },
      {
        id: "shortcuts",
        label: "Keyboard Shortcuts",
        description: "View all keyboard shortcuts",
        icon: Keyboard,
        category: "Help",
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
      {
        id: "profile",
        label: "Profile",
        description: "View your profile",
        icon: User,
        category: "Account",
        action: () => {
          router.push("/settings");
          onClose();
        },
      },
      {
        id: "logout",
        label: "Sign Out",
        description: "Sign out of your account",
        icon: LogOut,
        category: "Account",
        action: () => {
          logout();
          onClose();
        },
      },
    ],
    [handleNewTask, onClose, openSearch, toggleSidebar, router, logout]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    );
  }, [query, commands]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Flatten for navigation
  const flatCommands = useMemo(
    () => Object.values(groupedCommands).flat(),
    [groupedCommands]
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatCommands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + flatCommands.length) % flatCommands.length
          );
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, flatCommands, onClose]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-grey-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-scale-in rounded-2xl bg-white shadow-2xl ring-1 ring-grey-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-grey-100 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100">
            <Sparkles className="h-4 w-4 text-sage-600" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-grey-900 placeholder:text-grey-400 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 rounded-lg bg-grey-100 px-2 py-1 text-xs text-grey-500">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-2 last:mb-0">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-grey-400">
                {category}
              </p>
              {items.map((cmd) => {
                const index = currentIndex++;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
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
                        selectedIndex === index ? "bg-sage-100" : "bg-grey-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          selectedIndex === index
                            ? "text-sage-600"
                            : "text-grey-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cmd.label}</p>
                      {cmd.description && (
                        <p className="text-xs text-grey-500 truncate">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <div className="flex items-center gap-1">
                        {cmd.shortcut.map((key, i) => (
                          <kbd
                            key={i}
                            className="rounded bg-grey-100 px-1.5 py-0.5 text-[10px] font-medium text-grey-500"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                    {selectedIndex === index && (
                      <ChevronRight className="h-4 w-4 text-sage-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center">
              <Command className="mx-auto mb-2 h-8 w-8 text-grey-300" />
              <p className="text-grey-500">No commands found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-grey-100 px-4 py-2 text-xs text-grey-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-grey-100 px-1.5 py-0.5">↵</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>P</span> command palette
          </span>
        </div>
      </div>
    </div>
  );
}
