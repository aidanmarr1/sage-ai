"use client";

import { useState } from "react";
import { Terminal, FolderTree, Monitor, ClipboardList } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { usePlanStore } from "@/stores/planStore";
import type { WorkspaceTab } from "@/types";

const tabs: { id: WorkspaceTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "computer", label: "Computer", icon: Monitor, description: "Agent workspace" },
  { id: "plan", label: "Plan", icon: ClipboardList, description: "Current task plan" },
  { id: "terminal", label: "Terminal", icon: Terminal, description: "Command output" },
  { id: "files", label: "Files", icon: FolderTree, description: "Browse files" },
];

export function WorkspaceTabs() {
  const { activeTab, setActiveTab } = useWorkspaceStore();
  const { currentPlan, isGenerating } = usePlanStore();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const hasPlanActivity = currentPlan !== null || isGenerating;

  return (
    <div className="relative flex h-14 items-center justify-between border-b border-grey-200 bg-gradient-to-r from-white via-grey-50/50 to-white px-3">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          const Icon = tab.icon;

          return (
            <div key={tab.id} className="relative">
              <button
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-sage-100 to-sage-50 text-sage-700 shadow-sm"
                    : "text-grey-500 hover:bg-grey-100 hover:text-grey-700"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white/60 shadow-sm"
                      : "group-hover:bg-grey-200/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive ? "text-sage-600" : "text-grey-400 group-hover:text-grey-600",
                      !isActive && "group-hover:scale-110"
                    )}
                  />
                </div>
                <span>{tab.label}</span>
                {tab.id === "plan" && hasPlanActivity && !isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              {isHovered && !isActive && (
                <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 animate-fade-in">
                  <div className="whitespace-nowrap rounded-lg bg-grey-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl">
                    {tab.description}
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-grey-900" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
