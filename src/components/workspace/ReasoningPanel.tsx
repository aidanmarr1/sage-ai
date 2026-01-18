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
    <div className={cn("border-b border-grey-100 bg-sage-50/50", className)}>
      {/* Collapsed view - click to expand */}
      <button
        onClick={toggleReasoningExpanded}
        className="w-full flex items-center gap-2 px-6 py-2 hover:bg-sage-50 transition-colors text-left"
      >
        <Brain className="h-4 w-4 text-sage-600 flex-shrink-0" />
        <span className="text-xs text-sage-700 truncate flex-1">
          {currentReasoning || latestReasoning?.nextAction || "Analyzing..."}
        </span>
        {reasoningExpanded ? (
          <ChevronUp className="h-4 w-4 text-sage-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-sage-500 flex-shrink-0" />
        )}
      </button>

      {/* Expanded view */}
      {reasoningExpanded && latestReasoning && (
        <div className="px-6 pb-4 space-y-3 animate-fade-in-up">
          <ReasoningEntryCard entry={latestReasoning} />

          {/* Show history if there's more than one entry */}
          {reasoningHistory.length > 1 && (
            <ReasoningHistory entries={reasoningHistory.slice(0, -1)} />
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningEntryCard({ entry }: { entry: ReasoningEntry }) {
  return (
    <div className="space-y-2">
      {/* Observation */}
      {entry.observation && (
        <div className="flex gap-2">
          <Eye className="h-4 w-4 text-grey-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-medium text-grey-500 uppercase tracking-wide">
              Observation
            </span>
            <p className="text-sm text-grey-700 mt-0.5">{entry.observation}</p>
          </div>
        </div>
      )}

      {/* Analysis */}
      {entry.analysis && (
        <div className="flex gap-2">
          <Lightbulb className="h-4 w-4 text-grey-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-medium text-grey-500 uppercase tracking-wide">
              Analysis
            </span>
            <p className="text-sm text-grey-700 mt-0.5">{entry.analysis}</p>
          </div>
        </div>
      )}

      {/* Hypothesis */}
      {entry.hypothesis && (
        <div className="flex gap-2">
          <ListTree className="h-4 w-4 text-grey-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-medium text-grey-500 uppercase tracking-wide">
              Hypothesis
            </span>
            <p className="text-sm text-grey-700 mt-0.5">{entry.hypothesis}</p>
          </div>
        </div>
      )}

      {/* Next Action */}
      <div className="flex gap-2 p-2 bg-sage-100/50 rounded-lg">
        <ArrowRight className="h-4 w-4 text-sage-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-medium text-sage-600 uppercase tracking-wide">
            Next Action
          </span>
          <p className="text-sm text-sage-800 font-medium mt-0.5">
            {entry.nextAction}
          </p>
        </div>
      </div>

      {/* Alternatives */}
      {entry.alternatives && entry.alternatives.length > 0 && (
        <div className="text-xs text-grey-500">
          <span className="font-medium">Alternatives: </span>
          {entry.alternatives.join(", ")}
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
    <div className="border-t border-sage-200/50 pt-2 mt-2">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="text-xs text-sage-600 hover:text-sage-700 flex items-center gap-1"
      >
        {showHistory ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Hide previous reasoning ({entries.length})
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Show previous reasoning ({entries.length})
          </>
        )}
      </button>

      {showHistory && (
        <div className="mt-2 space-y-3">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="pl-3 border-l-2 border-grey-200 opacity-70"
            >
              <div className="text-xs text-grey-500 mb-1">
                Step {entry.stepIndex + 1} ·{" "}
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-xs text-grey-600">
                <span className="font-medium">→</span> {entry.nextAction}
              </div>
              {entry.observation && (
                <div className="text-xs text-grey-500 mt-1">
                  {entry.observation.substring(0, 100)}
                  {entry.observation.length > 100 && "..."}
                </div>
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
        className="flex items-center gap-1.5 text-sage-600 hover:text-sage-700 transition-colors"
      >
        <Brain className="h-3 w-3" />
        <span className="truncate max-w-[200px]">{reasoning}</span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 p-2 bg-sage-50 rounded-lg text-grey-700 animate-fade-in-up">
          {reasoning}
        </div>
      )}
    </div>
  );
}
