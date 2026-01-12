"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { Terminal, Circle, Copy, Trash2, ChevronRight } from "lucide-react";

export function TerminalView() {
  const { terminalLines, addTerminalLine } = useWorkspaceStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  // Add some demo output on mount
  useEffect(() => {
    if (!initializedRef.current && terminalLines.length === 0) {
      initializedRef.current = true;
      addTerminalLine({ type: "info", content: "Sage AI Terminal v1.0.0" });
      addTerminalLine({ type: "info", content: "Ready for commands..." });
      addTerminalLine({ type: "output", content: "" });
      addTerminalLine({ type: "input", content: "$ npm run dev" });
      addTerminalLine({
        type: "output",
        content: "   - Local:        http://localhost:3000",
      });
      addTerminalLine({
        type: "output",
        content: "   - Ready in 1.2s",
      });
    }
  }, [addTerminalLine, terminalLines.length]);

  const handleCopy = () => {
    const text = terminalLines.map((l) => l.content).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="relative flex h-11 items-center justify-between border-b border-grey-100 bg-grey-50/50 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100">
            <Terminal className="h-4 w-4 text-grey-600" />
          </div>
          <span className="text-sm font-medium text-grey-700">Terminal</span>
          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
            bash
          </span>
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
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-400 transition-all hover:bg-grey-100 hover:text-grey-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto bg-grey-50 p-4 font-mono text-sm">
        {terminalLines.map((line) => (
          <div
            key={line.id}
            className={cn(
              "flex items-start gap-3 py-1 leading-relaxed",
              {
                input: "text-sage-700",
                output: "text-grey-600",
                error: "text-grey-500",
                info: "text-sage-600",
              }[line.type]
            )}
          >
            <span className="select-none text-grey-400 text-xs min-w-[60px]">
              {format(line.timestamp, "HH:mm:ss")}
            </span>
            {line.type === "input" && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-sage-500 mt-0.5" />
            )}
            {line.type !== "input" && <span className="w-4 flex-shrink-0" />}
            <span className="whitespace-pre-wrap">{line.content}</span>
          </div>
        ))}

        {/* Cursor line */}
        <div className="flex items-center gap-3 py-1 text-sage-700">
          <span className="select-none text-grey-400 text-xs min-w-[60px]">
            {format(new Date(), "HH:mm:ss")}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-sage-500" />
          <span className="inline-block h-4 w-2 animate-pulse bg-sage-500" />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="flex h-8 items-center justify-between border-t border-grey-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Circle className="h-2 w-2 fill-sage-500 text-sage-500" />
          <span className="text-xs text-grey-500">Connected</span>
        </div>
        <span className="font-mono text-xs text-grey-400">
          {terminalLines.length} lines
        </span>
      </div>
    </div>
  );
}
