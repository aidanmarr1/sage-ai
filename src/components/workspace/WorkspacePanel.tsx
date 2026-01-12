"use client";

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { ComputerPanel } from "./ComputerPanel";
import { PlanPanel } from "./PlanPanel";
import { TerminalView } from "@/components/terminal";
import { FileBrowser } from "@/components/file-browser";

export function WorkspacePanel() {
  const { activeTab } = useWorkspaceStore();

  return (
    <div className="flex h-full flex-col">
      <WorkspaceTabs />
      <div className="flex-1 overflow-hidden">
        {activeTab === "computer" && <ComputerPanel />}
        {activeTab === "plan" && <PlanPanel />}
        {activeTab === "terminal" && <TerminalView />}
        {activeTab === "files" && <FileBrowser />}
      </div>
    </div>
  );
}
