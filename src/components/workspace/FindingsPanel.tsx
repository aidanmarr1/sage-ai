"use client";

import { useAgentStore } from "@/stores/agentStore";
import { FileText, Download, Copy, Check, List, ChevronRight, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";

interface TOCItem {
  level: number;
  text: string;
  id: string;
}

export function FindingsPanel() {
  const { findings, isExecuting, qualityMetrics } = useAgentStore();
  const [copied, setCopied] = useState(false);
  const [showTOC, setShowTOC] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Extract table of contents from headings
  const tableOfContents = useMemo<TOCItem[]>(() => {
    if (!findings) return [];

    const toc: TOCItem[] = [];
    const lines = findings.split("\n");

    lines.forEach((line, index) => {
      if (line.startsWith("# ")) {
        toc.push({ level: 1, text: line.slice(2), id: `heading-${index}` });
      } else if (line.startsWith("## ")) {
        toc.push({ level: 2, text: line.slice(3), id: `heading-${index}` });
      } else if (line.startsWith("### ")) {
        toc.push({ level: 3, text: line.slice(4), id: `heading-${index}` });
      }
    });

    return toc;
  }, [findings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

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
    a.download = "sage-findings.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Beautiful empty state
  if (!findings && !isExecuting) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sage-100/40 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sage-200/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="group relative mb-8">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-sage-200/60 to-sage-300/40 opacity-0 blur-2xl transition-all duration-700 group-hover:opacity-100" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-sage-500 to-sage-600 shadow-2xl shadow-sage-500/30 transition-all duration-500 group-hover:scale-105">
                <FileText className="h-14 w-14 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-grey-900 mb-3">
              Research Findings
            </h3>
            <p className="text-grey-500 leading-relaxed">
              The agent will document research findings here with citations and analysis.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {[
                { label: "Auto-generated", icon: Sparkles },
                { label: "Markdown", icon: FileText },
                { label: "Citations", icon: ExternalLink },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-grey-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm text-grey-600 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-sage-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wordCount = findings ? findings.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grey-100 px-5 py-3.5 bg-gradient-to-r from-sage-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-md shadow-sage-500/20">
            <FileText className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-grey-900">Research Findings</span>
            {isExecuting && (
              <span className="ml-2 inline-flex items-center gap-1.5 animate-pulse rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage-500" />
                </span>
                Writing...
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* TOC toggle */}
          {tableOfContents.length > 0 && (
            <button
              onClick={() => setShowTOC(!showTOC)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                showTOC
                  ? "bg-sage-100 text-sage-600 shadow-sm"
                  : "text-grey-500 hover:bg-grey-100 hover:text-grey-700"
              )}
              title="Toggle table of contents"
            >
              <List className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!findings}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
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
              "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
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

      {/* Quality bar - only show if we have metrics */}
      {qualityMetrics && (
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-grey-100 bg-grey-50/50">
          <span className="text-xs font-medium text-grey-500">Quality</span>
          <div className="flex items-center gap-3 flex-1">
            <QualityMeter label="Sources" value={qualityMetrics.sourceDiversity} />
            <QualityMeter label="Facts" value={qualityMetrics.factVerification} />
            <QualityMeter label="Complete" value={qualityMetrics.completeness} />
          </div>
          <div className="text-xs font-semibold text-sage-700 bg-sage-100 px-2.5 py-1 rounded-full">
            {Math.round(qualityMetrics.avgScore * 20)}%
          </div>
        </div>
      )}

      {/* Main content area with optional TOC sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table of Contents sidebar */}
        {showTOC && tableOfContents.length > 0 && (
          <div className="w-52 flex-shrink-0 border-r border-grey-100 bg-grey-50/50 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-xs font-semibold text-grey-500 uppercase tracking-wider mb-3">
                Contents
              </h4>
              <nav className="space-y-1">
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      "w-full text-left text-sm transition-all flex items-center gap-2 py-1.5 px-2 rounded-lg",
                      activeSection === item.id
                        ? "bg-sage-100 text-sage-700 font-medium"
                        : "text-grey-600 hover:bg-grey-100 hover:text-grey-900",
                      item.level === 2 && "pl-4",
                      item.level === 3 && "pl-6 text-xs"
                    )}
                  >
                    <ChevronRight className={cn(
                      "h-3 w-3 flex-shrink-0 transition-transform",
                      activeSection === item.id && "rotate-90"
                    )} />
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {findings ? (
            <div className="p-6 max-w-3xl mx-auto">
              <article className="prose prose-sage prose-sm max-w-none">
                <MarkdownRenderer content={findings} />
              </article>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-sage-200/50 blur-xl animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg mx-auto">
                    <Sparkles className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
                <p className="text-sage-700 font-medium mb-1">Generating findings...</p>
                <p className="text-xs text-grey-500">
                  Content will stream here as the agent works
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with stats */}
      {findings && (
        <div className="flex items-center justify-between border-t border-grey-100 bg-grey-50/50 px-5 py-2.5">
          <div className="flex items-center gap-4 text-xs text-grey-500">
            <span className="font-medium">{wordCount} words</span>
            <span>•</span>
            <span>{tableOfContents.length} sections</span>
          </div>
          <span className="text-xs text-grey-400">
            Updated just now
          </span>
        </div>
      )}
    </div>
  );
}

function QualityMeter({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 20); // Convert 1-5 scale to percentage
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-grey-500">{label}</span>
      <div className="w-16 h-1.5 bg-grey-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percentage >= 80 ? "bg-sage-500" : percentage >= 60 ? "bg-sage-400" : "bg-grey-400"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Enhanced markdown renderer with IDs for TOC navigation
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        // Heading 1
        if (line.startsWith("# ")) {
          return (
            <h1
              key={index}
              id={`heading-${index}`}
              className="font-serif text-2xl font-bold text-grey-900 mt-8 first:mt-0 scroll-mt-6 pb-2 border-b border-grey-100"
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
              id={`heading-${index}`}
              className="font-serif text-xl font-semibold text-grey-900 mt-6 first:mt-0 scroll-mt-6"
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
              id={`heading-${index}`}
              className="font-semibold text-grey-800 mt-5 first:mt-0 scroll-mt-6"
            >
              {line.slice(4)}
            </h3>
          );
        }

        // Bullet point
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={index} className="flex gap-3 pl-1">
              <span className="text-sage-500 mt-1.5">•</span>
              <span className="text-grey-700 leading-relaxed">
                <InlineMarkdown text={line.slice(2)} />
              </span>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-3 pl-1">
              <span className="text-sage-600 font-semibold min-w-[1.5rem] mt-0.5">
                {numberedMatch[1]}.
              </span>
              <span className="text-grey-700 leading-relaxed">
                <InlineMarkdown text={line.slice(numberedMatch[0].length)} />
              </span>
            </div>
          );
        }

        // Empty line
        if (line.trim() === "") {
          return <div key={index} className="h-3" />;
        }

        // Regular paragraph
        return (
          <p key={index} className="text-grey-700 leading-relaxed">
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Handle inline markdown (bold, italic, links, code)
function InlineMarkdown({ text }: { text: string }) {
  // Handle links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkParts = text.split(linkRegex);

  const processedParts: React.ReactNode[] = [];
  for (let i = 0; i < linkParts.length; i++) {
    if (i % 3 === 0) {
      // Regular text - process for bold and code
      processedParts.push(<InlineFormatting key={i} text={linkParts[i]} />);
    } else if (i % 3 === 1) {
      // Link text
      const linkText = linkParts[i];
      const linkUrl = linkParts[i + 1];
      processedParts.push(
        <a
          key={i}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sage-600 hover:text-sage-700 underline underline-offset-2 decoration-sage-300 hover:decoration-sage-500 transition-colors"
        >
          {linkText}
        </a>
      );
      i++; // Skip the URL part
    }
  }

  return <>{processedParts}</>;
}

// Handle bold and inline code
function InlineFormatting({ text }: { text: string }) {
  // Handle inline code `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {codeParts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded-md bg-sage-50 border border-sage-100 px-1.5 py-0.5 font-mono text-xs text-sage-700"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Handle bold **text**
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return boldParts.map((boldPart, boldIndex) => {
          if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
            return (
              <strong key={`${index}-${boldIndex}`} className="font-semibold text-grey-900">
                {boldPart.slice(2, -2)}
              </strong>
            );
          }
          return <span key={`${index}-${boldIndex}`}>{boldPart}</span>;
        });
      })}
    </>
  );
}
