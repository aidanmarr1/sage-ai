"use client";

import { useState } from "react";
import { useAgentStore, type ReasoningEntry } from "@/stores/agentStore";
import { cn } from "@/lib/cn";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Eye,
  Lightbulb,
  ArrowRight,
  ListTree,
  Sparkles,
  Clock,
} from "lucide-react";

interface ReasoningPanelProps {
  className?: string;
}

export function ReasoningPanel({ className }: ReasoningPanelProps) {
  const {
    currentReasoning,
    reasoningHistory,
    reasoningExpanded,
    toggleReasoningExpanded,
    isExecuting,
  } = useAgentStore();

  const latestReasoning = reasoningHistory[reasoningHistory.length - 1];

  // Don't show if no reasoning and not executing
  if (!currentReasoning && reasoningHistory.length === 0 && !isExecuting) {
    return null;
  }

  return (
    <div className={cn("border-b border-grey-100 bg-gradient-to-r from-sage-50/80 to-sage-50/30", className)}>
      {/* Collapsed view - click to expand */}
      <button
        onClick={toggleReasoningExpanded}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-sage-50/50 transition-colors text-left group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 group-hover:bg-sage-200 transition-colors">
          <Brain className="h-4 w-4 text-sage-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide">
              Agent Reasoning
            </span>
            {isExecuting && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
              </span>
            )}
          </div>
          <p className="text-sm text-grey-700 truncate mt-0.5">
            {currentReasoning || latestReasoning?.nextAction || "Analyzing the task..."}
          </p>
        </div>
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
          reasoningExpanded ? "bg-sage-200 rotate-180" : "bg-transparent"
        )}>
          <ChevronDown className="h-4 w-4 text-sage-600" />
        </div>
      </button>

      {/* Expanded view */}
      {reasoningExpanded && latestReasoning && (
        <div className="px-5 pb-4 space-y-4 animate-fade-in-up">
          <ReasoningEntryCard entry={latestReasoning} isLatest />

          {/* Show history if there's more than one entry */}
          {reasoningHistory.length > 1 && (
            <ReasoningHistory entries={reasoningHistory.slice(0, -1)} />
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningEntryCard({ entry, isLatest = false }: { entry: ReasoningEntry; isLatest?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3",
      isLatest
        ? "bg-white border-sage-200 shadow-sm"
        : "bg-grey-50/50 border-grey-200"
    )}>
      {/* Observation */}
      {entry.observation && (
        <div className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100 flex-shrink-0">
            <Eye className="h-3.5 w-3.5 text-grey-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wide">
              Observation
            </span>
            <p className="text-sm text-grey-700 mt-1 leading-relaxed">{entry.observation}</p>
          </div>
        </div>
      )}

      {/* Analysis */}
      {entry.analysis && (
        <div className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100 flex-shrink-0">
            <Lightbulb className="h-3.5 w-3.5 text-grey-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wide">
              Analysis
            </span>
            <p className="text-sm text-grey-700 mt-1 leading-relaxed">{entry.analysis}</p>
          </div>
        </div>
      )}

      {/* Hypothesis */}
      {entry.hypothesis && (
        <div className="flex gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100 flex-shrink-0">
            <ListTree className="h-3.5 w-3.5 text-grey-500" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-grey-500 uppercase tracking-wide">
              Hypothesis
            </span>
            <p className="text-sm text-grey-700 mt-1 leading-relaxed">{entry.hypothesis}</p>
          </div>
        </div>
      )}

      {/* Next Action - highlighted */}
      <div className="flex gap-3 p-3 bg-sage-50 rounded-lg border border-sage-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage-200 flex-shrink-0">
          <ArrowRight className="h-3.5 w-3.5 text-sage-700" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-sage-600 uppercase tracking-wide">
            Next Action
          </span>
          <p className="text-sm text-sage-800 font-medium mt-1">
            {entry.nextAction}
          </p>
        </div>
      </div>

      {/* Alternatives */}
      {entry.alternatives && entry.alternatives.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-grey-500 pt-1">
          <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-medium">Alternatives considered: </span>
            {entry.alternatives.join(" • ")}
          </span>
        </div>
      )}
    </div>
  );
}

function ReasoningHistory({ entries }: { entries: ReasoningEntry[] }) {
  const [showHistory, setShowHistory] = useState(false);

  // Sort by most recent first
  const sortedEntries = [...entries].reverse();

  return (
    <div className="border-t border-sage-100/50 pt-3">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-xs font-medium text-sage-600 hover:text-sage-700 transition-colors"
      >
        {showHistory ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Hide previous reasoning ({entries.length})
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            View previous reasoning ({entries.length})
          </>
        )}
      </button>

      {showHistory && (
        <div className="mt-3 space-y-3">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="relative pl-4 border-l-2 border-grey-200 opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center gap-2 text-xs text-grey-500 mb-1.5">
                <Clock className="h-3 w-3" />
                <span>Step {entry.stepIndex + 1}</span>
                <span>•</span>
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-sage-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-grey-700">{entry.nextAction}</p>
              </div>
              {entry.observation && (
                <p className="text-xs text-grey-500 mt-1 line-clamp-2 ml-5">
                  {entry.observation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact reasoning indicator for use in step cards
 */
export function CompactReasoningIndicator({
  reasoning,
  className,
}: {
  reasoning: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("text-xs", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sage-600 hover:text-sage-700 transition-colors group"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-sage-100 group-hover:bg-sage-200 transition-colors">
          <Brain className="h-3 w-3" />
        </div>
        <span className="truncate max-w-[200px]">{reasoning}</span>
        <ChevronDown className={cn(
          "h-3 w-3 flex-shrink-0 transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-sage-50 rounded-lg text-grey-700 animate-fade-in-up border border-sage-100">
          {reasoning}
        </div>
      )}
    </div>
  );
}
