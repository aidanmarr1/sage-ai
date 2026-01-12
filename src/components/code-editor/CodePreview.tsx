"use client";

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { CodeTabs } from "./CodeTabs";
import { FileCode, Code, Copy, Download, Settings2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage-200 border-t-sage-600" />
        <span className="text-sm text-grey-400">Loading editor...</span>
      </div>
    </div>
  ),
});

const getLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    py: "python",
    rs: "rust",
    go: "go",
  };
  return languageMap[ext || ""] || "plaintext";
};

const getLanguageLabel = (filename: string): string => {
  const lang = getLanguage(filename);
  const labelMap: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    json: "JSON",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    markdown: "Markdown",
    python: "Python",
    rust: "Rust",
    go: "Go",
    plaintext: "Plain Text",
  };
  return labelMap[lang] || "Plain Text";
};

export function CodePreview() {
  const { openFiles, activeFileId } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);

  const activeFile = openFiles.find((f) => f.id === activeFileId);

  const handleCopy = () => {
    if (activeFile?.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (openFiles.length === 0) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-grey-50 via-white to-grey-50 p-8 text-center">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sage-100/30 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-sage-100/30 blur-3xl" />
        </div>

        <div className="relative">
          <div className="group mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-grey-100 to-grey-200 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <FileCode className="h-10 w-10 text-grey-400 transition-colors group-hover:text-sage-500" />
            </div>
          </div>
          <h3 className="font-serif text-xl font-semibold text-grey-900">
            No file open
          </h3>
          <p className="mt-2 max-w-xs text-sm text-grey-500">
            Select a file from the file browser to view its contents here
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-grey-100 px-3 py-1.5">
              <Code className="h-4 w-4 text-grey-400" />
              <span className="text-xs text-grey-500">Syntax highlighting</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-grey-100 px-3 py-1.5">
              <Copy className="h-4 w-4 text-grey-400" />
              <span className="text-xs text-grey-500">Copy to clipboard</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <CodeTabs />

      {/* Editor Header */}
      {activeFile && (
        <div className="flex h-10 items-center justify-between border-b border-grey-100 bg-grey-50/30 px-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
              {getLanguageLabel(activeFile.name)}
            </span>
            <span className="text-xs text-grey-400">Read only</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all",
                copied
                  ? "bg-sage-100 text-sage-700"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600">
              <Download className="h-3.5 w-3.5" />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600">
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeFile && (
          <Editor
            height="100%"
            language={getLanguage(activeFile.name)}
            value={activeFile.content || `// Contents of ${activeFile.name}`}
            theme="vs-light"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 16 },
              fontFamily: "'JetBrains Mono', Menlo, Monaco, monospace",
              renderLineHighlight: "none",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        )}
      </div>

      {/* Footer */}
      {activeFile && (
        <div className="flex h-7 items-center justify-between border-t border-grey-100 bg-grey-50/50 px-4">
          <span className="font-mono text-xs text-grey-400">{activeFile.path}</span>
          <span className="text-xs text-grey-400">
            {activeFile.content ? `${activeFile.content.split("\n").length} lines` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
