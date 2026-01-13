"use client";

import { X, ChevronUp, Monitor, ClipboardList, FileText, LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { WorkspaceTab } from "@/types";
import { usePlanStore } from "@/stores/planStore";
import { useAgentStore } from "@/stores/agentStore";

interface MobileWorkspaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileWorkspaceSheet({
  isOpen,
  onClose,
  children,
}: MobileWorkspaceSheetProps) {
  const { activeTab, setActiveTab } = useWorkspaceStore();
  const { currentPlan } = usePlanStore();
  const { findings } = useAgentStore();

  const tabs: { id: WorkspaceTab; label: string; icon: LucideIcon; badge: string | null }[] = [
    { id: "computer", label: "Computer", icon: Monitor, badge: null },
    { id: "plan", label: "Plan", icon: ClipboardList, badge: currentPlan ? "1" : null },
    { id: "findings", label: "Findings", icon: FileText, badge: findings.length > 0 ? findings.length.toString() : null },
  ];

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-grey-900/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl bg-white shadow-2xl">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-grey-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-grey-100 px-4 pb-3">
          <h3 className="font-serif text-lg font-semibold text-grey-900">
            Workspace
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-400 hover:bg-grey-100 hover:text-grey-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-grey-100 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sage-100 text-sage-700"
                    : "text-grey-500 hover:bg-grey-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sage-500 px-1.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Trigger button for mobile
export function MobileWorkspaceTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  const { currentPlan } = usePlanStore();
  const { isExecuting, findings } = useAgentStore();

  const hasActivity = currentPlan !== null || isExecuting || findings.length > 0;

  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-sage-500 px-4 py-3 text-white shadow-lg shadow-sage-500/30 transition-all hover:bg-sage-600 hover:shadow-xl active:scale-95"
    >
      <ChevronUp className="h-5 w-5" />
      <span className="text-sm font-medium">Workspace</span>
      {hasActivity && (
        <span className="flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      )}
    </button>
  );
}
