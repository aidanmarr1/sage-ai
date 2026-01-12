"use client";

import { createElement } from "react";
import {
  File,
  FileJson,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Image,
  FileType,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface FileIconProps {
  name: string;
  type: "file" | "directory";
  isOpen?: boolean;
  className?: string;
}

const getFileIcon = (name: string): LucideIcon => {
  const ext = name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return FileCode;
    case "json":
      return FileJson;
    case "md":
    case "txt":
      return FileText;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return Image;
    case "css":
    case "scss":
    case "less":
      return FileType;
    default:
      return File;
  }
};

const getFileColor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
      return "text-yellow-500";
    case "ts":
    case "tsx":
      return "text-blue-500";
    case "json":
      return "text-yellow-600";
    case "md":
      return "text-grey-500";
    case "css":
    case "scss":
      return "text-pink-500";
    default:
      return "text-grey-400";
  }
};

export function FileIcon({ name, type, isOpen, className }: FileIconProps) {
  if (type === "directory") {
    const IconComponent = isOpen ? FolderOpen : Folder;
    return createElement(IconComponent, { className: cn("h-4 w-4 text-sage-500", className) });
  }

  const iconComponent = getFileIcon(name);
  const colorClass = getFileColor(name);

  return createElement(iconComponent, { className: cn("h-4 w-4", colorClass, className) });
}
