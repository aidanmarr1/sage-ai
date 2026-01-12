"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { FileIcon } from "@/components/file-browser";

export function CodeTabs() {
  const { openFiles, activeFileId, setActiveFile, closeFile } =
    useWorkspaceStore();

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex h-11 items-end gap-1 overflow-x-auto border-b border-grey-200 bg-grey-50/50 px-2 pt-1">
      {openFiles.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <button
            key={file.id}
            onClick={() => setActiveFile(file.id)}
            className={cn(
              "group relative flex h-9 items-center gap-2 rounded-t-lg px-3 text-sm transition-all duration-150",
              isActive
                ? "bg-white text-grey-900 shadow-sm"
                : "text-grey-500 hover:bg-grey-100 hover:text-grey-700"
            )}
          >
            {/* Active indicator */}
            {isActive && (
              <div className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-sage-500" />
            )}

            <FileIcon name={file.name} type="file" className="h-4 w-4" />
            <span className={cn(
              "max-w-[100px] truncate transition-colors",
              isActive && "font-medium"
            )}>
              {file.name}
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                isActive
                  ? "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                  : "opacity-0 text-grey-400 hover:bg-grey-200 hover:text-grey-600 group-hover:opacity-100"
              )}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}

      {/* Add file indicator */}
      <div className="flex h-9 items-center px-2 text-grey-300">
        <div className="h-4 w-px bg-grey-200" />
      </div>
    </div>
  );
}
