export interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  images?: ImageAttachment[];
}

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  content: string;
  timestamp: Date;
}

export type WorkspaceTab = "terminal" | "files" | "computer" | "plan";

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
}

export interface AgentActivity {
  id: string;
  action: string;
  timestamp: Date;
  status: "running" | "completed" | "error";
}
