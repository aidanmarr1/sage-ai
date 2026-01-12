"use client";

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { FileTreeNode } from "./FileTreeNode";
import { FolderOpen } from "lucide-react";

export function FileTree() {
  const { fileTree } = useWorkspaceStore();

  if (fileTree.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-grey-100">
          <FolderOpen className="h-7 w-7 text-grey-400" />
        </div>
        <p className="font-medium text-grey-700">No files loaded</p>
        <p className="mt-1 max-w-[200px] text-xs text-grey-400">
          Files will appear here when the agent accesses them
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {fileTree.map((node) => (
        <FileTreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}
