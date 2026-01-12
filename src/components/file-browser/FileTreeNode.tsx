"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { FileIcon } from "./FileIcon";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { FileNode } from "@/types";

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
}

export function FileTreeNode({ node, level = 0 }: FileTreeNodeProps) {
  const { expandedFolders, toggleFolder, selectFile, selectedFile, openFile } =
    useWorkspaceStore();

  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFile?.id === node.id;
  const isDirectory = node.type === "directory";

  const handleClick = () => {
    if (isDirectory) {
      toggleFolder(node.id);
    } else {
      selectFile(node);
      openFile(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm transition-all duration-150",
          "hover:bg-grey-100",
          isSelected
            ? "bg-gradient-to-r from-sage-100 to-sage-50 text-sage-900"
            : "text-grey-700"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isDirectory ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 text-grey-400 transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        <FileIcon name={node.name} type={node.type} isOpen={isExpanded} />
        <span className={cn(
          "truncate transition-colors",
          isSelected && "font-medium"
        )}>
          {node.name}
        </span>
        {isSelected && (
          <div className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sage-500" />
        )}
      </button>
      {isDirectory && isExpanded && node.children && (
        <div className="relative">
          {/* Tree connector line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-grey-100"
            style={{ left: `${level * 12 + 18}px` }}
          />
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
