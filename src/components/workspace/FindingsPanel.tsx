"use client";

import { useAgentStore } from "@/stores/agentStore";
import { FileText, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function FindingsPanel() {
  const { findings, isExecuting } = useAgentStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!findings) return;
    try {
      await navigator.clipboard.writeText(findings);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    if (!findings) return;
    const blob = new Blob([findings], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "findings.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!findings && !isExecuting) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-100/30 blur-3xl" />
        </div>

        <div className="relative flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="group relative mb-6">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-sage-200/50 to-sage-300/30 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/25 transition-all duration-500 group-hover:scale-105">
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-grey-900">
              No Findings Yet
            </h3>
            <p className="mt-2 max-w-xs text-sm text-grey-500">
              Execute a plan to start generating research findings. The agent will document its discoveries here.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Auto-generated", "Markdown format", "Copy & export"].map((feature) => (
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
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grey-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-sage-600" />
          <span className="font-medium text-grey-900">Research Findings</span>
          {isExecuting && (
            <span className="animate-pulse rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
              Updating...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!findings}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              findings
                ? "text-grey-500 hover:bg-grey-100 hover:text-grey-700"
                : "text-grey-300 cursor-not-allowed"
            )}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-sage-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!findings}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              findings
                ? "text-grey-500 hover:bg-grey-100 hover:text-grey-700"
                : "text-grey-300 cursor-not-allowed"
            )}
            title="Download as Markdown"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {findings ? (
          <div className="prose prose-sm prose-grey max-w-none">
            <MarkdownRenderer content={findings} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-pulse text-sage-600 mb-2">
                Generating findings...
              </div>
              <p className="text-xs text-grey-400">
                Content will appear here as the agent works
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown renderer
function MarkdownRenderer({ content }: { content: string }) {
  // Split content into lines and render
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Heading 1
        if (line.startsWith("# ")) {
          return (
            <h1
              key={index}
              className="font-serif text-xl font-bold text-grey-900 mt-4 first:mt-0"
            >
              {line.slice(2)}
            </h1>
          );
        }

        // Heading 2
        if (line.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="font-serif text-lg font-semibold text-grey-900 mt-4 first:mt-0"
            >
              {line.slice(3)}
            </h2>
          );
        }

        // Heading 3
        if (line.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="font-semibold text-grey-800 mt-3 first:mt-0"
            >
              {line.slice(4)}
            </h3>
          );
        }

        // Bullet point
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={index} className="flex gap-2 pl-2">
              <span className="text-sage-500">•</span>
              <span className="text-grey-700">
                <InlineMarkdown text={line.slice(2)} />
              </span>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2 pl-2">
              <span className="text-sage-600 font-medium min-w-[1.5rem]">
                {numberedMatch[1]}.
              </span>
              <span className="text-grey-700">
                <InlineMarkdown text={line.slice(numberedMatch[0].length)} />
              </span>
            </div>
          );
        }

        // Empty line
        if (line.trim() === "") {
          return <div key={index} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={index} className="text-grey-700">
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Handle inline markdown (bold, italic, links)
function InlineMarkdown({ text }: { text: string }) {
  // Handle bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-grey-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
