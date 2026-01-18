"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Home,
  Settings,
  ChevronLeft,
  User,
  Sparkles,
  MessageSquare,
  History,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Command,
  Crown,
  Bell,
  Search,
  Star,
  Trash2,
  Clock,
  Calendar,
  Pencil,
  Check,
  X,
  Filter,
  Archive,
  FolderOpen,
} from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useConversationStore, type Conversation } from "@/stores/conversationStore";
import { useChatStore } from "@/stores/chatStore";
import { usePlanStore } from "@/stores/planStore";
import { useSearchStore } from "@/stores/searchStore";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, subDays } from "date-fns";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge: string | null;
  shortcut: string | null;
};

const mainNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home, badge: null, shortcut: "H" },
  { id: "tasks", label: "Tasks", icon: MessageSquare, badge: null, shortcut: "T" },
  { id: "history", label: "History", icon: History, badge: null, shortcut: "Y" },
];

const secondaryNavItems: NavItem[] = [
  { id: "help", label: "Help & Support", icon: HelpCircle, badge: null, shortcut: "?" },
  { id: "settings", label: "Settings", icon: Settings, badge: null, shortcut: "," },
];

type FilterType = "all" | "starred" | "recent";

// Group conversations by date
function groupConversations(conversations: Conversation[]) {
  const groups: {
    starred: Conversation[];
    today: Conversation[];
    yesterday: Conversation[];
    thisWeek: Conversation[];
    earlier: Conversation[];
  } = {
    starred: [],
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);

    if (conv.starred) {
      groups.starred.push(conv);
    } else if (isToday(date)) {
      groups.today.push(conv);
    } else if (isYesterday(date)) {
      groups.yesterday.push(conv);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(conv);
    } else {
      groups.earlier.push(conv);
    }
  });

  return groups;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    conversations,
    currentConversationId,
    fetchConversations,
    toggleStar,
    deleteConversation,
    setCurrentConversation,
    renameConversation,
  } = useConversationStore();
  const { clearMessages } = useChatStore();
  const { clearPlan } = usePlanStore();
  const { openSearch } = useSearchStore();

  const [activeNav, setActiveNav] = useState("tasks");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedSections, setExpandedSections] = useState({
    starred: true,
    today: true,
    yesterday: true,
    thisWeek: false,
    earlier: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Fetch conversations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Group and filter conversations
  const groupedConversations = useMemo(() => {
    let filtered = conversations;

    if (filter === "starred") {
      filtered = conversations.filter((c) => c.starred);
    } else if (filter === "recent") {
      const weekAgo = subDays(new Date(), 7);
      filtered = conversations.filter((c) => new Date(c.updatedAt) >= weekAgo);
    }

    return groupConversations(filtered);
  }, [conversations, filter]);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    if (navId === "tasks" || navId === "home") {
      setCurrentConversation(null);
      clearMessages();
      clearPlan();
      router.push("/");
    } else if (navId === "help") {
      router.push("/help");
    } else if (navId === "settings") {
      router.push("/settings");
    } else if (navId === "history") {
      router.push("/");
    }
  };

  const handleConversationClick = (convId: string) => {
    setCurrentConversation(convId);
    router.push(`/task/${convId}`);
  };

  const handleToggleStar = (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStar(convId);
  };

  const handleDelete = (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation(convId);
  };

  const handleStartEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (convId: string) => {
    if (editTitle.trim() && renameConversation) {
      renameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const handleToggleSidebar = () => {
    if (sidebarOpen) setUserMenuOpen(false);
    toggleSidebar();
  };

  // Conversation Group Component
  const ConversationGroup = ({
    title,
    icon: Icon,
    conversations,
    sectionKey,
    color = "text-grey-400",
  }: {
    title: string;
    icon: React.ElementType;
    conversations: Conversation[];
    sectionKey: keyof typeof expandedSections;
    color?: string;
  }) => {
    if (conversations.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-grey-400 hover:text-grey-600 transition-colors"
        >
          <Icon className={cn("h-3 w-3", color)} />
          <span className="flex-1 text-left">{title}</span>
          <span className="rounded-full bg-grey-100 px-1.5 py-0.5 text-[10px] font-medium text-grey-500">
            {conversations.length}
          </span>
          <ChevronRight
            className={cn(
              "h-3 w-3 text-grey-400 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {isExpanded && (
          <div className="space-y-0.5 mt-1 animate-fade-in">
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Single Conversation Item
  const ConversationItem = ({ conv }: { conv: Conversation }) => {
    const isHovered = hoveredTask === conv.id;
    const isActive = pathname === `/task/${conv.id}` || currentConversationId === conv.id;
    const isEditing = editingId === conv.id;

    return (
      <div
        className="group relative"
        onMouseEnter={() => setHoveredTask(conv.id)}
        onMouseLeave={() => setHoveredTask(null)}
      >
        {isEditing ? (
          // Edit mode
          <div className="flex items-center gap-1 px-3 py-1.5">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(conv.id);
                if (e.key === "Escape") handleCancelEdit();
              }}
              autoFocus
              className="flex-1 rounded-md border border-sage-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
            <button
              onClick={() => handleSaveEdit(conv.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-sage-100 text-sage-600 hover:bg-sage-200 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-grey-100 text-grey-600 hover:bg-grey-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          // View mode
          <button
            onClick={() => handleConversationClick(conv.id)}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-all",
              isActive
                ? "bg-sage-50 border-l-2 border-sage-400 text-grey-900"
                : "hover:bg-grey-50 hover:translate-x-0.5"
            )}
          >
            {conv.starred ? (
              <Star className="h-3.5 w-3.5 flex-shrink-0 fill-sage-500 text-sage-500" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-grey-300" />
            )}
            <span
              className={cn(
                "flex-1 truncate text-sm",
                isActive ? "font-medium text-grey-900" : "text-grey-600"
              )}
            >
              {conv.title}
            </span>
            {!isHovered && (
              <span className="text-[10px] text-grey-400">{formatTime(conv.updatedAt)}</span>
            )}
          </button>
        )}

        {/* Action buttons on hover */}
        {isHovered && !isEditing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 animate-fade-in bg-white rounded-md shadow-sm border border-grey-100 p-0.5">
            <button
              onClick={(e) => handleStartEdit(conv, e)}
              className="flex h-6 w-6 items-center justify-center rounded text-grey-400 hover:bg-grey-100 hover:text-grey-600 transition-all"
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => handleToggleStar(conv.id, e)}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded transition-all",
                conv.starred
                  ? "text-sage-500 hover:bg-sage-100"
                  : "text-grey-400 hover:bg-grey-100 hover:text-grey-600"
              )}
              title={conv.starred ? "Unstar" : "Star"}
            >
              <Star className={cn("h-3 w-3", conv.starred && "fill-current")} />
            </button>
            <button
              onClick={(e) => handleDelete(conv.id, e)}
              className="flex h-6 w-6 items-center justify-center rounded text-grey-400 hover:bg-grey-100 hover:text-grey-600 transition-all"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const NavItem = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeNav === item.id;
    const isHovered = hoveredItem === item.id;

    return (
      <div className="relative">
        <button
          onClick={() => handleNavClick(item.id)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]",
            sidebarOpen ? "justify-start gap-3 px-3 py-2.5" : "justify-center p-3",
            isActive
              ? "bg-gradient-to-r from-sage-100 to-sage-50 text-sage-700 shadow-sm"
              : "text-grey-600 hover:bg-grey-50 hover:text-grey-900"
          )}
        >
          {isActive && sidebarOpen && (
            <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sage-500" />
          )}

          <div
            className={cn(
              "relative flex flex-shrink-0 items-center justify-center transition-all duration-200",
              !sidebarOpen && isActive && "rounded-lg bg-sage-100 p-1.5",
              sidebarOpen && "h-5 w-5",
              !sidebarOpen && !isActive && "h-5 w-5"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-all duration-200",
                isActive ? "text-sage-600" : "text-grey-500 group-hover:text-grey-700",
                !isActive && "group-hover:scale-110"
              )}
            />
            {!sidebarOpen && item.badge && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-sage-500" />
            )}
          </div>

          <span
            className={cn(
              "flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300",
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            {item.label}
          </span>

          {sidebarOpen && item.badge && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sage-100 px-1.5 text-xs font-semibold text-sage-700">
              {item.badge}
            </span>
          )}
          {sidebarOpen && !item.badge && item.shortcut && (
            <kbd className="hidden rounded bg-grey-100 px-1.5 py-0.5 font-mono text-[10px] text-grey-400 group-hover:block">
              {item.shortcut}
            </kbd>
          )}
        </button>

        {!sidebarOpen && isHovered && (
          <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 animate-fade-in">
            <div className="flex items-center gap-2 rounded-lg bg-grey-900 px-3 py-2 text-sm font-medium text-white shadow-xl">
              {item.label}
              {item.badge && (
                <span className="rounded-full bg-sage-500 px-1.5 py-0.5 text-xs">
                  {item.badge}
                </span>
              )}
              {item.shortcut && !item.badge && (
                <kbd className="rounded bg-grey-700 px-1.5 py-0.5 font-mono text-[10px] text-grey-300">
                  {item.shortcut}
                </kbd>
              )}
              <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-grey-900" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-white transition-all duration-300 ease-in-out",
        "border-r border-grey-200/60",
        sidebarOpen ? "w-72" : "w-[72px]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sage-50/30 via-transparent to-transparent" />

      {/* Scrollable Content */}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Logo Section */}
        <div
          className={cn(
            "relative flex h-[72px] flex-shrink-0 items-center",
            sidebarOpen ? "justify-start px-3" : "justify-center"
          )}
        >
          <div className="group relative flex items-center">
            <Image
              src="/sage-logo.png"
              alt="Sage"
              width={sidebarOpen ? 220 : 52}
              height={72}
              className={cn(
                "object-contain transition-all duration-300 group-hover:scale-105",
                sidebarOpen ? "h-[72px] w-auto -ml-3" : "h-12 w-12"
              )}
            />
          </div>
        </div>

        {/* New Task Button */}
        <div className={cn("relative", sidebarOpen ? "px-3 pb-2" : "px-2 pb-2")}>
          <button
            onClick={() => handleNavClick("tasks")}
            onMouseEnter={() => !sidebarOpen && setHoveredItem("newtask")}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "group flex w-full items-center rounded-xl bg-gradient-to-r from-sage-500 to-sage-600 text-sm font-medium text-white shadow-md shadow-sage-500/25 transition-all duration-200",
              "hover:shadow-lg hover:shadow-sage-500/30 active:scale-[0.98]",
              sidebarOpen ? "gap-2 px-3 py-2.5" : "justify-center p-3"
            )}
          >
            <Plus className={cn("transition-all group-hover:rotate-90", sidebarOpen ? "h-4 w-4" : "h-5 w-5")} />
            <span
              className={cn(
                "flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300",
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              New Task
            </span>
            {sidebarOpen && (
              <kbd className="flex items-center gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
                <Command className="h-2.5 w-2.5" />N
              </kbd>
            )}
          </button>
          {!sidebarOpen && hoveredItem === "newtask" && (
            <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 animate-fade-in">
              <div className="flex items-center gap-2 rounded-lg bg-grey-900 px-3 py-2 text-sm font-medium text-white shadow-xl">
                New Task
                <kbd className="rounded bg-grey-700 px-1.5 py-0.5 font-mono text-[10px] text-grey-300">
                  ⌘N
                </kbd>
                <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-grey-900" />
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className={cn("relative", sidebarOpen ? "px-3 pb-3" : "px-2 pb-2")}>
          <button
            onClick={openSearch}
            onMouseEnter={() => !sidebarOpen && setHoveredItem("search")}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "group flex w-full items-center rounded-xl bg-grey-50 text-sm text-grey-400 transition-all duration-200",
              "hover:bg-grey-100 hover:text-grey-600 active:scale-[0.98]",
              sidebarOpen ? "gap-2 px-3 py-2" : "justify-center p-3"
            )}
          >
            <Search className={cn("transition-all", sidebarOpen ? "h-4 w-4" : "h-5 w-5")} />
            <span
              className={cn(
                "flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300",
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              Search tasks...
            </span>
            {sidebarOpen && (
              <kbd className="flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-grey-400 shadow-sm ring-1 ring-grey-200">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            )}
          </button>
          {!sidebarOpen && hoveredItem === "search" && (
            <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 animate-fade-in">
              <div className="flex items-center gap-2 rounded-lg bg-grey-900 px-3 py-2 text-sm font-medium text-white shadow-xl">
                Search
                <kbd className="rounded bg-grey-700 px-1.5 py-0.5 font-mono text-[10px] text-grey-300">
                  ⌘K
                </kbd>
                <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-grey-900" />
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs - Only when expanded */}
        {sidebarOpen && conversations.length > 0 && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1 rounded-lg bg-grey-50 p-1">
              {[
                { id: "all" as FilterType, label: "All", icon: FolderOpen },
                { id: "starred" as FilterType, label: "Starred", icon: Star },
                { id: "recent" as FilterType, label: "Recent", icon: Clock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                    filter === tab.id
                      ? "bg-white text-sage-700 shadow-sm"
                      : "text-grey-500 hover:text-grey-700"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations - Grouped by Date */}
        {sidebarOpen && conversations.length > 0 && (
          <div className="relative z-10 px-3 pb-2 flex-1">
            <ConversationGroup
              title="Starred"
              icon={Star}
              conversations={groupedConversations.starred}
              sectionKey="starred"
              color="text-sage-500"
            />
            <ConversationGroup
              title="Today"
              icon={Clock}
              conversations={groupedConversations.today}
              sectionKey="today"
              color="text-sage-500"
            />
            <ConversationGroup
              title="Yesterday"
              icon={Calendar}
              conversations={groupedConversations.yesterday}
              sectionKey="yesterday"
            />
            <ConversationGroup
              title="This Week"
              icon={Calendar}
              conversations={groupedConversations.thisWeek}
              sectionKey="thisWeek"
            />
            <ConversationGroup
              title="Earlier"
              icon={Archive}
              conversations={groupedConversations.earlier}
              sectionKey="earlier"
            />
          </div>
        )}

        {/* Empty State */}
        {sidebarOpen && conversations.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 mb-3">
              <MessageSquare className="h-6 w-6 text-sage-600" />
            </div>
            <h3 className="text-sm font-semibold text-grey-900 mb-1">No tasks yet</h3>
            <p className="text-xs text-grey-500 mb-4">
              Start a new task to begin your research journey
            </p>
            <button
              onClick={() => handleNavClick("tasks")}
              className="flex items-center gap-1.5 rounded-lg bg-sage-50 px-3 py-1.5 text-xs font-medium text-sage-700 hover:bg-sage-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first task
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className={cn("relative py-2 mt-auto", sidebarOpen ? "px-3" : "px-2")}>
          {sidebarOpen && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-grey-400">
              Navigation
            </p>
          )}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>

          <div className={cn("my-4", sidebarOpen ? "border-t border-grey-100" : "flex justify-center")}>
            {!sidebarOpen && <div className="h-px w-8 bg-grey-200" />}
          </div>

          {sidebarOpen && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-grey-400">
              More
            </p>
          )}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </nav>
      </div>

      {/* Agent Status Card */}
      <div className={cn("relative py-2", sidebarOpen ? "px-3" : "px-2")}>
        <div
          className={cn(
            "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage-50 via-sage-100/50 to-white transition-all duration-300",
            "border border-sage-200/60 shadow-sm hover:shadow-md",
            sidebarOpen ? "p-3" : "p-2"
          )}
        >
          <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-sage-200/40 blur-2xl transition-all duration-500 group-hover:bg-sage-300/50" />

          <div
            className={cn(
              "relative flex items-center",
              sidebarOpen ? "gap-3" : "justify-center"
            )}
          >
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-sage-100",
                  "h-10 w-10"
                )}
              >
                <Sparkles className="h-5 w-5 text-sage-600" />
              </div>
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sage-500 ring-2 ring-white"></span>
              </span>
            </div>
            <div
              className={cn(
                "flex-1 overflow-hidden transition-all duration-300",
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              <p className="whitespace-nowrap text-sm font-semibold text-sage-800">
                Agent Online
              </p>
              <p className="whitespace-nowrap text-xs text-sage-600">
                Ready to assist
              </p>
            </div>
          </div>

          {sidebarOpen && (
            <div className="relative mt-3 pt-3 border-t border-sage-200/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sage-600">Daily usage</span>
                <span className="font-medium text-sage-800">12 / 50 tasks</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sage-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500"
                  style={{ width: "24%" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Section */}
      <div className={cn("relative border-t border-grey-100", sidebarOpen ? "p-3" : "p-2")}>
        <button
          onClick={() => sidebarOpen && setUserMenuOpen(!userMenuOpen)}
          onMouseEnter={() => !sidebarOpen && setHoveredItem("user")}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "group flex w-full items-center rounded-xl transition-all duration-200 hover:bg-grey-50 active:scale-[0.98]",
            sidebarOpen ? "gap-3 px-2 py-2.5" : "justify-center p-2",
            userMenuOpen && "bg-grey-50"
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <span className="text-sm font-bold text-sage-700">
                {user?.name?.slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-sage-500" />
          </div>
          <div
            className={cn(
              "flex flex-1 items-center justify-between overflow-hidden transition-all duration-300",
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            <div className="text-left">
              <p className="whitespace-nowrap text-sm font-semibold text-grey-900">
                {user?.name || "Guest"}
              </p>
              <p className="flex items-center gap-1 whitespace-nowrap text-xs text-grey-500">
                {isAuthenticated ? "Free Plan" : "Not signed in"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-grey-400 transition-transform duration-200",
                userMenuOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {!sidebarOpen && hoveredItem === "user" && (
          <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 animate-fade-in">
            <div className="rounded-lg bg-grey-900 px-3 py-2 shadow-xl">
              <p className="text-sm font-medium text-white">{user?.name || "Guest"}</p>
              <p className="text-xs text-grey-400">{isAuthenticated ? "Free Plan" : "Not signed in"}</p>
              <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-grey-900" />
            </div>
          </div>
        )}

        {sidebarOpen && userMenuOpen && (
          <div className="mt-2 animate-fade-in rounded-xl border border-grey-100 bg-white p-1 shadow-lg">
            <div className="mx-1 mb-1 rounded-lg bg-gradient-to-r from-sage-50 to-sage-100/50 p-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Crown className="h-4 w-4 text-sage-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-sage-800">Upgrade to Pro</p>
                  <p className="text-[10px] text-sage-600">Unlimited tasks & more</p>
                </div>
              </div>
            </div>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-grey-600 transition-colors hover:bg-grey-50 hover:text-grey-900">
              <User className="h-4 w-4" />
              Profile
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-grey-600 transition-colors hover:bg-grey-50 hover:text-grey-900">
              <Bell className="h-4 w-4" />
              Notifications
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-grey-600 transition-colors hover:bg-grey-50 hover:text-grey-900">
              <Settings className="h-4 w-4" />
              Preferences
            </button>
            <div className="my-1 border-t border-grey-100" />
            <button
              onClick={() => {
                logout();
                setUserMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-grey-600 transition-colors hover:bg-grey-50 hover:text-grey-900"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className={cn("relative border-t border-grey-100", sidebarOpen ? "p-3" : "p-2")}>
        <button
          onClick={handleToggleSidebar}
          onMouseEnter={() => !sidebarOpen && setHoveredItem("collapse")}
          onMouseLeave={() => setHoveredItem(null)}
          className={cn(
            "group flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200",
            "text-grey-500 hover:bg-grey-50 hover:text-grey-700 active:scale-[0.98]",
            sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center p-3"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg bg-grey-100 transition-all duration-200",
              "group-hover:bg-sage-100 group-hover:text-sage-600"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                !sidebarOpen && "rotate-180"
              )}
            />
          </div>
          <span
            className={cn(
              "flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300",
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Collapse
          </span>
          {sidebarOpen && (
            <kbd className="flex items-center gap-0.5 rounded-md bg-grey-100 px-1.5 py-0.5 font-mono text-[10px] text-grey-400 transition-colors group-hover:bg-sage-100 group-hover:text-sage-600">
              <Command className="h-2.5 w-2.5" />B
            </kbd>
          )}
        </button>

        {!sidebarOpen && hoveredItem === "collapse" && (
          <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 animate-fade-in">
            <div className="flex items-center gap-2 rounded-lg bg-grey-900 px-3 py-2 text-sm font-medium text-white shadow-xl">
              Expand
              <kbd className="rounded bg-grey-700 px-1.5 py-0.5 font-mono text-[10px] text-grey-300">
                ⌘B
              </kbd>
              <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-grey-900" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
