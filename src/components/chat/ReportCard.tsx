"use client";

import { useState, useMemo } from "react";
import { useAgentStore } from "@/stores/agentStore";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import ReactMarkdown from "react-markdown";

export function ReportCard() {
  const { finalReport, isExecuting } = useAgentStore();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract title from report (first h1)
  const title = useMemo(() => {
    const match = finalReport.match(/^#\s+(.+)$/m);
    return match ? match[1] : "Research Report";
  }, [finalReport]);

  // Count sections and words
  const stats = useMemo(() => {
    const sections = (finalReport.match(/^##\s+/gm) || []).length;
    const words = finalReport.split(/\s+/).filter(Boolean).length;
    return { sections, words };
  }, [finalReport]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([finalReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!finalReport || isExecuting) return null;

  return (
    <div
      className={cn(
        "group rounded-2xl border transition-all duration-300 animate-slide-up",
        expanded
          ? "border-sage-200 bg-white shadow-lg ring-1 ring-sage-100"
          : "border-grey-200 bg-gradient-to-br from-white to-grey-50 hover:border-sage-300 hover:shadow-md cursor-pointer"
      )}
    >
      {/* Header - always visible */}
      <div
        className={cn(
          "flex items-start gap-4 p-5",
          !expanded && "cursor-pointer"
        )}
        onClick={() => !expanded && setExpanded(true)}
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/20">
          <FileText className="h-6 w-6 text-white" />
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sage-100 text-[10px] font-bold text-sage-700 ring-2 ring-white">
            ✓
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-grey-900 truncate">
              {title}
            </h3>
            {expanded && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-grey-600 hover:bg-grey-100 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-sage-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-grey-600 hover:bg-grey-100 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            )}
          </div>

          <p className="mt-1 text-sm text-grey-500">
            {stats.sections} sections, {stats.words} words
          </p>

          {!expanded && (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-sage-600">
              <span>Click to view full report</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          <div className="border-t border-grey-100" />
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <article className="prose prose-grey prose-sm max-w-none prose-headings:font-serif prose-headings:text-grey-900 prose-p:text-grey-700 prose-a:text-sage-600 prose-strong:text-grey-800 prose-ul:text-grey-700 prose-li:text-grey-700">
              <ReactMarkdown>{finalReport}</ReactMarkdown>
            </article>
          </div>
          <div className="border-t border-grey-100" />
          <button
            onClick={() => setExpanded(false)}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-grey-500 hover:text-grey-700 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
            Collapse
          </button>
        </>
      )}
    </div>
  );
}
