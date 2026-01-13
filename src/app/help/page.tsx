"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ListChecks,
  Terminal,
  FolderOpen,
  Keyboard,
  CreditCard,
  HelpCircle,
  AlertTriangle,
  Mail,
  Github,
  ArrowLeft,
  Monitor,
  Star,
  Trash2,
  Plus,
  Image,
  Command,
  Zap,
  BookOpen,
  Lightbulb,
  Target,
  Clock,
  Shield,
  Smile,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  FileText,
  PenTool,
  Brain,
  Code,
  BarChart3,
  Users,
  Globe,
  Rocket,
  Heart,
  Coffee,
  ExternalLink,
  Layout,
  PanelLeft,
  MessageCircle,
  Layers,
  Eye,
  Lock,
  Database,
  History,
  ChevronUp,
  Circle,
  Check,
  Wand2,
  MousePointer,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  RefreshCw,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

// ============================================================================
// DATA
// ============================================================================

const quickStartSteps = [
  {
    step: 1,
    title: "Start a New Task",
    description: "Click 'New Task' in the sidebar or press ⌘N to begin",
    icon: Plus,
  },
  {
    step: 2,
    title: "Describe What You Need",
    description: "Type your request clearly - be specific about your goals",
    icon: MessageSquare,
  },
  {
    step: 3,
    title: "Review the Plan",
    description: "Sage creates a step-by-step plan for actionable requests",
    icon: ListChecks,
  },
  {
    step: 4,
    title: "Collaborate & Iterate",
    description: "Continue the conversation to refine and complete your task",
    icon: Sparkles,
  },
];

const interfaceGuide = [
  {
    id: "sidebar",
    title: "Sidebar",
    icon: PanelLeft,
    description: "Your navigation hub for tasks and settings",
    features: [
      { name: "New Task", description: "Start a fresh conversation with Sage" },
      { name: "Recent Tasks", description: "Quick access to your latest conversations" },
      { name: "Search", description: "Find any task by keyword" },
      { name: "Navigation", description: "Access Home, Tasks, History, Help, and Settings" },
    ],
  },
  {
    id: "chat",
    title: "Chat Area",
    icon: MessageCircle,
    description: "Where you interact with Sage",
    features: [
      { name: "Message Input", description: "Type your questions or requests here" },
      { name: "Image Attachments", description: "Click paperclip to add images" },
      { name: "Emoji Picker", description: "Add emojis to your messages" },
      { name: "Send Button", description: "Press Enter or click to send" },
    ],
  },
  {
    id: "workspace",
    title: "Workspace Panel",
    icon: Layers,
    description: "Tools and outputs for complex tasks",
    features: [
      { name: "Computer", description: "Visual workspace for the AI agent" },
      { name: "Plan", description: "Step-by-step breakdown of your task" },
      { name: "Terminal", description: "Command execution output" },
      { name: "Files", description: "File browser for agent workspace" },
    ],
  },
];

const exampleConversations = [
  {
    type: "Research Task",
    color: "sage",
    messages: [
      { role: "user", content: "Help me research the best productivity apps for remote work" },
      { role: "assistant", content: "I'll help you find the best productivity apps for remote work. Let me create a plan to research and compare the top options for you." },
    ],
    planSteps: [
      "Research top-rated productivity apps for remote teams",
      "Compare features, pricing, and user reviews",
      "Categorize by use case (communication, project management, etc.)",
      "Create a summary with recommendations",
    ],
  },
  {
    type: "Writing Task",
    color: "sage",
    messages: [
      { role: "user", content: "Write a professional email to decline a job offer politely" },
      { role: "assistant", content: "I'll help you craft a professional and courteous email to decline the job offer while maintaining a positive relationship." },
    ],
    planSteps: [
      "Express gratitude for the offer and their time",
      "Clearly but politely state your decision",
      "Provide a brief, professional reason (optional)",
      "Keep the door open for future opportunities",
    ],
  },
  {
    type: "Simple Greeting",
    color: "grey",
    messages: [
      { role: "user", content: "Hey! How's it going?" },
      { role: "assistant", content: "Hey there! I'm doing great, thanks for asking! I'm Sage, your AI assistant, and I'm ready to help with whatever you need. Whether it's research, writing, planning, or problem-solving - just let me know what's on your mind!" },
    ],
    planSteps: null,
  },
];

const useCases = [
  {
    category: "Writing & Content",
    icon: PenTool,
    color: "sage",
    examples: [
      "Write a blog post about sustainable living",
      "Draft a professional email to a client",
      "Create social media captions for my product launch",
      "Help me write a cover letter for a tech job",
      "Proofread and improve my essay",
    ],
  },
  {
    category: "Research & Analysis",
    icon: Brain,
    color: "sage",
    examples: [
      "Research the pros and cons of electric vehicles",
      "Summarize the latest trends in AI",
      "Compare different project management tools",
      "Analyze the market for mobile apps",
      "Find statistics about remote work productivity",
    ],
  },
  {
    category: "Planning & Strategy",
    icon: Target,
    color: "sage",
    examples: [
      "Create a marketing plan for my startup",
      "Plan a 7-day trip to Japan",
      "Develop a study schedule for my exams",
      "Outline a business proposal",
      "Create a weekly meal plan",
    ],
  },
  {
    category: "Code & Technical",
    icon: Code,
    color: "sage",
    examples: [
      "Explain how React hooks work",
      "Debug this JavaScript function",
      "Write a Python script to organize files",
      "Review my code for best practices",
      "Help me set up a REST API",
    ],
  },
  {
    category: "Creative & Brainstorming",
    icon: Lightbulb,
    color: "sage",
    examples: [
      "Generate ideas for a mobile app",
      "Brainstorm names for my new business",
      "Help me create a unique logo concept",
      "Suggest improvements for my website",
      "Come up with creative gift ideas",
    ],
  },
  {
    category: "Data & Analysis",
    icon: BarChart3,
    color: "sage",
    examples: [
      "Help me analyze this spreadsheet data",
      "Create a survey for customer feedback",
      "Interpret these sales numbers",
      "Build a financial projection model",
      "Explain statistical concepts",
    ],
  },
];

const howToGuides = [
  {
    title: "Write Effective Prompts",
    icon: PenTool,
    tips: [
      "Be specific about your goal and desired outcome",
      "Include relevant context and constraints",
      "Specify the format you want (bullet points, paragraphs, etc.)",
      "Mention your target audience if applicable",
    ],
  },
  {
    title: "Use Images for Better Results",
    icon: Image,
    tips: [
      "Attach screenshots when asking about UI/UX feedback",
      "Include diagrams to explain complex ideas",
      "Share examples of styles you like",
      "Use clear, high-quality images for best results",
    ],
  },
  {
    title: "Break Down Complex Tasks",
    icon: ListChecks,
    tips: [
      "Start with the big picture, then drill into details",
      "Ask for one thing at a time for better focus",
      "Use follow-up messages to refine and expand",
      "Review each step before moving to the next",
    ],
  },
  {
    title: "Iterate on Sage's Responses",
    icon: RefreshCw,
    tips: [
      "Say 'Make it shorter' or 'Add more detail'",
      "Ask to 'Try a different approach'",
      "Request specific changes: 'Change the tone to...'",
      "Build on good parts: 'Keep X but change Y'",
    ],
  },
];

const proTips = [
  {
    tip: "Be Specific",
    description: "The more details you provide, the better Sage can help. Include context, goals, and constraints.",
    icon: Target,
  },
  {
    tip: "Use Follow-ups",
    description: "Don't hesitate to ask follow-up questions or request modifications. Sage remembers your conversation.",
    icon: MessageSquare,
  },
  {
    tip: "Attach Images",
    description: "You can attach images for visual context - great for design feedback, screenshots, or diagrams.",
    icon: Image,
  },
  {
    tip: "Break Down Complex Tasks",
    description: "For large projects, break them into smaller tasks. This helps Sage provide more focused assistance.",
    icon: ListChecks,
  },
  {
    tip: "Review the Plan",
    description: "Always check the generated plan before proceeding. You can ask Sage to modify or expand on any step.",
    icon: CheckCircle2,
  },
  {
    tip: "Star Important Tasks",
    description: "Use the star feature to bookmark important conversations for quick access later.",
    icon: Star,
  },
];

const advancedTips = [
  {
    tip: "Use Specific Formats",
    description: "Ask for output in specific formats: 'Give me a bullet list', 'Write this as a table', 'Format as JSON'",
    icon: FileText,
  },
  {
    tip: "Set the Tone",
    description: "Specify the tone: 'Make it professional', 'Keep it casual', 'Write for executives', 'Explain like I'm 5'",
    icon: Wand2,
  },
  {
    tip: "Iterate Quickly",
    description: "Say 'Make it shorter', 'Add more detail', or 'Try a different approach' to refine outputs",
    icon: ArrowRight,
  },
  {
    tip: "Provide Examples",
    description: "Share examples of what you want: 'Write something like this but for...' helps Sage understand your style",
    icon: Eye,
  },
];

const faqCategories = ["All", "General", "Features", "Account", "Usage", "Privacy"];

const faqs = [
  {
    question: "What exactly is Sage?",
    answer: "Sage is a general-purpose AI agent - not just a chatbot. It can understand complex requests, create actionable plans, and help you work through multi-step problems. Whether you need help with research, writing, coding, planning, or creative tasks, Sage adapts to your needs and provides intelligent assistance.",
    category: "General",
  },
  {
    question: "What's the difference between Sage and other AI chatbots?",
    answer: "Unlike simple chatbots that just respond to messages, Sage is designed as an AI agent that can plan, reason, and execute tasks. When you give Sage an actionable request, it creates a structured plan with clear steps. Sage also has access to workspace tools like a terminal, file browser, and visual display for more complex tasks.",
    category: "General",
  },
  {
    question: "Why doesn't every message create a plan?",
    answer: "Sage is smart enough to distinguish between casual conversation and actionable requests. If you say 'hi' or 'how are you', Sage responds conversationally. But when you ask something like 'help me write a business plan' or 'research the best laptops under $1000', Sage recognizes this as a task and generates a structured plan to help you accomplish it.",
    category: "Features",
  },
  {
    question: "Can Sage remember our previous conversations?",
    answer: "Yes! Each task/conversation is saved to your account. When you click on a task in the sidebar, Sage loads the entire conversation history. This means you can pick up where you left off, ask follow-up questions, or continue working on the same project days later.",
    category: "Features",
  },
  {
    question: "What types of files can I attach?",
    answer: "Currently, Sage supports image attachments (PNG, JPG, GIF, WebP, etc.). You can attach images by clicking the paperclip icon or by dragging and dropping directly into the chat. This is great for getting feedback on designs, explaining visual concepts, or sharing screenshots.",
    category: "Features",
  },
  {
    question: "Is there a limit to how much I can use Sage?",
    answer: "The Free Plan includes 50 tasks per day, which resets at midnight. Each task can have unlimited messages within it. If you need more, you can upgrade to Pro for unlimited tasks and additional features.",
    category: "Account",
  },
  {
    question: "How is my data protected?",
    answer: "Your conversations are private and encrypted. Only you can access your tasks when signed in. We don't share your conversation data with third parties or use it to train models without consent. You can delete any task at any time.",
    category: "Privacy",
  },
  {
    question: "Can I use Sage for work/commercial purposes?",
    answer: "Absolutely! Sage is designed for both personal and professional use. Many users rely on Sage for business tasks like writing proposals, analyzing data, planning projects, and more. The Pro plan is especially suited for professional use with unlimited tasks.",
    category: "Account",
  },
  {
    question: "What should I do if Sage gives an incorrect answer?",
    answer: "While Sage strives for accuracy, it can sometimes make mistakes. If you notice an error, simply point it out in the conversation - say something like 'That's not quite right, can you reconsider?' Sage will acknowledge the feedback and provide a corrected response.",
    category: "Usage",
  },
  {
    question: "Can Sage browse the internet or access external websites?",
    answer: "Sage has knowledge up to its training date and can provide information based on that. For the most current information on rapidly changing topics, it's always good to verify with up-to-date sources. Sage can help you understand what to look for and how to evaluate information.",
    category: "Features",
  },
  {
    question: "How do I get the best results from Sage?",
    answer: "Be specific and provide context! Instead of 'write an email', try 'write a professional email to my manager requesting a meeting to discuss my project timeline, keeping a friendly but formal tone'. The more details you provide about your goals, audience, and constraints, the better Sage can help.",
    category: "Usage",
  },
  {
    question: "Can multiple people use the same Sage account?",
    answer: "Each Sage account is designed for individual use. For teams and organizations, we're working on team plans that will allow collaboration features. For now, each person should have their own account for the best experience.",
    category: "Account",
  },
  {
    question: "How do I delete a task?",
    answer: "Hover over any task in the sidebar's Recent section and click the trash icon that appears. This will permanently delete the task and all its messages. Note: This action cannot be undone.",
    category: "Features",
  },
  {
    question: "Can I export my conversations?",
    answer: "Export functionality is coming soon. We're working on allowing you to export your tasks in various formats (PDF, Markdown, etc.) for record-keeping or sharing purposes.",
    category: "Features",
  },
  {
    question: "Does Sage work on mobile?",
    answer: "Yes! Sage is fully responsive and works on all devices. While we recommend using a desktop for complex tasks, you can easily chat with Sage on your phone or tablet for quick questions and simple tasks.",
    category: "General",
  },
  {
    question: "What languages does Sage support?",
    answer: "Sage can understand and respond in many languages. While English is the primary language with the best performance, you can communicate in Spanish, French, German, Japanese, Chinese, and many more languages.",
    category: "Features",
  },
];

const keyboardShortcuts = [
  { keys: ["⌘", "N"], action: "New Task", description: "Start a new task/conversation", category: "Navigation" },
  { keys: ["⌘", "K"], action: "Search", description: "Open search dialog", category: "Navigation" },
  { keys: ["⌘", "B"], action: "Toggle Sidebar", description: "Collapse or expand the sidebar", category: "Navigation" },
  { keys: ["⌘", "\\"], action: "Toggle Workspace", description: "Show or hide the workspace panel", category: "Navigation" },
  { keys: ["Enter"], action: "Send Message", description: "Send your current message", category: "Chat" },
  { keys: ["Shift", "Enter"], action: "New Line", description: "Add a new line without sending", category: "Chat" },
  { keys: ["⌘", "↑"], action: "Previous Message", description: "Edit your previous message", category: "Chat" },
  { keys: ["Esc"], action: "Cancel", description: "Cancel current action or close dialogs", category: "General" },
  { keys: ["⌘", ","], action: "Settings", description: "Open settings page", category: "Navigation" },
  { keys: ["?"], action: "Help", description: "Open this help page", category: "Navigation" },
  { keys: ["H"], action: "Home", description: "Go to home page", category: "Navigation" },
  { keys: ["T"], action: "Tasks", description: "View all tasks", category: "Navigation" },
];

const troubleshootingItems = [
  {
    problem: "Messages not sending",
    icon: Send,
    severity: "common",
    solutions: [
      "Check your internet connection - try loading another website",
      "Refresh the page with ⌘ + R (Mac) or Ctrl + R (Windows)",
      "Make sure you're signed in - check the user menu in the sidebar",
      "Check if you've exceeded the daily task limit (50 tasks on Free plan)",
      "Try clearing your browser cache and cookies",
    ],
  },
  {
    problem: "Tasks not appearing in sidebar",
    icon: FolderOpen,
    severity: "common",
    solutions: [
      "Ensure you're signed in to your account",
      "Try expanding the sidebar if it's collapsed (⌘ + B)",
      "Refresh the page to fetch the latest tasks",
      "Check if the task was created - conversational messages don't create tasks",
    ],
  },
  {
    problem: "Plan not generating",
    icon: ListChecks,
    severity: "common",
    solutions: [
      "Make sure your request is actionable, not just a greeting",
      "Be more specific about what you need help with",
      "Try rephrasing: 'Help me [specific task]' instead of vague requests",
      "Example: 'Help me write a marketing email' will generate a plan; 'hi' will not",
    ],
  },
  {
    problem: "Page not loading or frozen",
    icon: AlertTriangle,
    severity: "technical",
    solutions: [
      "Hard refresh: ⌘ + Shift + R (Mac) or Ctrl + Shift + R (Windows)",
      "Clear browser cache and cookies",
      "Try a different browser (Chrome, Firefox, Safari, Edge)",
      "Disable browser extensions that might interfere",
      "Check if there's a known outage at status.sage-ai.com",
    ],
  },
  {
    problem: "Images not uploading",
    icon: Image,
    severity: "common",
    solutions: [
      "Check that the file is an image (PNG, JPG, GIF, WebP)",
      "Ensure the file isn't too large (max 10MB recommended)",
      "Try a different image format",
      "Make sure you're clicking the paperclip icon or dragging to the chat area",
    ],
  },
  {
    problem: "Keyboard shortcuts not working",
    icon: Keyboard,
    severity: "technical",
    solutions: [
      "Make sure the chat input isn't focused (click outside first)",
      "Check if another application is capturing the shortcut",
      "On Mac, ensure you're using ⌘ (Command), not Ctrl",
      "Try refreshing the page",
    ],
  },
  {
    problem: "Slow responses",
    icon: Clock,
    severity: "common",
    solutions: [
      "Complex tasks may take longer - this is normal for detailed requests",
      "Check your internet connection speed",
      "Try simplifying your request if it's very long",
      "During peak hours, responses may take slightly longer",
    ],
  },
];

const glossaryTerms = [
  { term: "Task", definition: "A conversation or project in Sage. Each time you start something new, it creates a task that's saved to your sidebar.", icon: FileText },
  { term: "Plan", definition: "A structured, step-by-step breakdown that Sage creates for actionable requests. Plans help organize complex tasks into manageable steps.", icon: ListChecks },
  { term: "Workspace", definition: "The right panel containing Computer, Plan, Terminal, and Files tabs. This is where Sage's tools and outputs are displayed.", icon: Layout },
  { term: "Agent", definition: "Sage is an AI agent - more than a chatbot. Agents can plan, reason, use tools, and complete multi-step tasks autonomously.", icon: Sparkles },
  { term: "Actionable Request", definition: "A message that asks Sage to do something specific, like writing, researching, or planning. These trigger plan generation.", icon: Target },
  { term: "Conversational Message", definition: "Casual messages like greetings that don't require a structured response or plan.", icon: MessageCircle },
  { term: "Starring", definition: "Marking a task as important by clicking the star icon. Starred tasks appear at the top of your task list.", icon: Star },
  { term: "Context", definition: "The information Sage uses to understand your request. More context leads to better, more relevant responses.", icon: Brain },
];

const whatsNewItems = [
  {
    version: "1.2.0",
    date: "January 2025",
    title: "Enhanced Task Management",
    isNew: true,
    highlights: [
      "Star important tasks for quick access",
      "Improved sidebar navigation",
      "Better task search functionality",
      "Faster message loading",
    ],
  },
  {
    version: "1.1.0",
    date: "December 2024",
    title: "Image Attachments",
    isNew: false,
    highlights: [
      "Attach images to your messages",
      "Support for PNG, JPG, GIF, WebP",
      "Drag and drop support",
      "Image preview before sending",
    ],
  },
  {
    version: "1.0.0",
    date: "November 2024",
    title: "Initial Launch",
    isNew: false,
    highlights: [
      "AI-powered task assistance",
      "Smart plan generation",
      "Conversation history",
      "Workspace with multiple tools",
    ],
  },
];

const privacyFeatures = [
  {
    title: "End-to-End Encryption",
    description: "All your conversations are encrypted in transit and at rest",
    icon: Lock,
  },
  {
    title: "Private by Default",
    description: "Only you can access your tasks and conversations",
    icon: Shield,
  },
  {
    title: "Data Ownership",
    description: "You own your data and can delete it at any time",
    icon: Database,
  },
  {
    title: "No Data Selling",
    description: "We never sell your data to third parties",
    icon: XCircle,
  },
];

const onboardingChecklist = [
  { id: "account", label: "Create your account", description: "Sign up with email or Google" },
  { id: "first-task", label: "Start your first task", description: "Ask Sage anything to get started" },
  { id: "explore-plan", label: "Explore a generated plan", description: "See how Sage breaks down complex tasks" },
  { id: "star-task", label: "Star an important task", description: "Keep your favorites easy to find" },
  { id: "try-image", label: "Try attaching an image", description: "Add visual context to your requests" },
  { id: "use-shortcut", label: "Use a keyboard shortcut", description: "Try ⌘+N to start a new task" },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
        copied
          ? "bg-sage-100 text-sage-600"
          : "text-grey-400 hover:bg-grey-100 hover:text-grey-600",
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function WasThisHelpful({ section }: { section: string }) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  if (feedback) {
    return (
      <div className="mt-8 rounded-xl border border-sage-200 bg-sage-50 p-4 text-center">
        <p className="text-sage-700 font-medium">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-grey-200 bg-grey-50 p-4">
      <div className="flex items-center justify-center gap-4">
        <span className="text-grey-600 text-sm">Was this helpful?</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFeedback("yes")}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-grey-700 shadow-sm ring-1 ring-grey-200 transition-all hover:bg-sage-50 hover:text-sage-700 hover:ring-sage-200"
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </button>
          <button
            onClick={() => setFeedback("no")}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-grey-700 shadow-sm ring-1 ring-grey-200 transition-all hover:bg-grey-100"
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </button>
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sage-500 text-white shadow-lg transition-all hover:bg-sage-600 hover:shadow-xl",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

function OnboardingChecklist() {
  const [completed, setCompleted] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCompleted(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const progress = (completed.length / onboardingChecklist.length) * 100;
  const allComplete = completed.length === onboardingChecklist.length;

  return (
    <div className="rounded-2xl border border-grey-200 bg-white overflow-hidden">
      <div className={cn(
        "border-b border-grey-100 p-5 transition-colors",
        allComplete ? "bg-sage-100" : "bg-gradient-to-r from-sage-50 to-white"
      )}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-grey-900">
            {allComplete ? "All Done!" : "Getting Started Checklist"}
          </h4>
          <span className="text-sm font-medium text-sage-600">
            {completed.length}/{onboardingChecklist.length} complete
          </span>
        </div>
        <div className="h-2 bg-grey-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="p-2">
        {onboardingChecklist.map((item) => {
          const isComplete = completed.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all",
                isComplete ? "bg-sage-50" : "hover:bg-grey-50"
              )}
            >
              <div className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all transform",
                isComplete
                  ? "border-sage-500 bg-sage-500 scale-110"
                  : "border-grey-300"
              )}>
                {isComplete && <Check className="h-3.5 w-3.5 text-white" />}
              </div>
              <div>
                <p className={cn(
                  "font-medium transition-all",
                  isComplete ? "text-sage-700 line-through" : "text-grey-900"
                )}>
                  {item.label}
                </p>
                <p className="text-sm text-grey-500">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExampleConversation({ example }: { example: typeof exampleConversations[0] }) {
  return (
    <div className="rounded-2xl border border-grey-200 bg-white overflow-hidden transition-all hover:shadow-md">
      <div className="border-b border-grey-100 bg-grey-50 px-5 py-3">
        <span className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
          example.planSteps ? "bg-sage-100 text-sage-700" : "bg-grey-200 text-grey-600"
        )}>
          {example.planSteps ? <ListChecks className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
          {example.type}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {example.messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}>
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <div className={cn(
              "rounded-2xl px-4 py-2.5 max-w-[80%]",
              msg.role === "user"
                ? "bg-grey-900 text-white"
                : "bg-grey-100 text-grey-800"
            )}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      {example.planSteps && (
        <div className="border-t border-grey-100 bg-sage-50/50 p-4">
          <p className="text-xs font-medium text-sage-700 mb-2 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Generated Plan
          </p>
          <ol className="space-y-1.5">
            {example.planSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-grey-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-200 text-xs font-medium text-sage-700 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function FAQAccordion({
  items,
  searchQuery,
  selectedCategory,
  allExpanded
}: {
  items: typeof faqs;
  searchQuery: string;
  selectedCategory: string;
  allExpanded: boolean;
}) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  useEffect(() => {
    if (allExpanded) {
      setOpenIndices(items.map((_, i) => i));
    } else {
      setOpenIndices([]);
    }
  }, [allExpanded, items]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, searchQuery, selectedCategory]);

  const toggleItem = (index: number) => {
    setOpenIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-xl border border-grey-200 bg-grey-50 p-6 text-center">
        <p className="text-grey-600">No matching questions found. Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredItems.map((item, index) => {
        const isOpen = openIndices.includes(index);
        return (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-grey-200 bg-white transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-grey-50"
            >
              <div className="flex items-center gap-3 pr-4">
                <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                  {item.category}
                </span>
                <span className="font-medium text-grey-900">{item.question}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 flex-shrink-0 text-grey-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-grey-100 bg-grey-50/50 px-5 py-4">
                  <p className="text-grey-600 leading-relaxed">{item.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const allContent = [
    ...faqs.map((f) => ({ type: "FAQ", title: f.question, content: f.answer })),
    ...troubleshootingItems.map((t) => ({
      type: "Troubleshooting",
      title: t.problem,
      content: t.solutions.join(" "),
    })),
    ...glossaryTerms.map((g) => ({ type: "Glossary", title: g.term, content: g.definition })),
    ...proTips.map((t) => ({ type: "Tip", title: t.tip, content: t.description })),
    ...advancedTips.map((t) => ({ type: "Advanced Tip", title: t.tip, content: t.description })),
    ...useCases.flatMap((c) => c.examples.map(e => ({ type: "Example", title: c.category, content: e }))),
    ...howToGuides.flatMap((g) => g.tips.map(t => ({ type: "How To", title: g.title, content: t }))),
  ];

  const results = allContent.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase())
  );

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-sage-100 text-sage-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <div className="rounded-2xl border border-grey-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-grey-100">
            <Search className="h-8 w-8 text-grey-400" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-grey-900 mb-2">No results found</h3>
          <p className="text-grey-600 mb-4">We couldn't find anything matching "{query}"</p>
          <button
            onClick={onClear}
            className="text-sage-600 hover:text-sage-700 font-medium"
          >
            Clear search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-grey-600">
          Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
        </p>
        <button
          onClick={onClear}
          className="text-sm text-sage-600 hover:text-sage-700 font-medium"
        >
          Clear search
        </button>
      </div>
      <div className="space-y-3">
        {results.slice(0, 15).map((result, index) => (
          <div
            key={index}
            className="rounded-xl border border-grey-200 bg-white p-4 transition-all hover:shadow-sm animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">
                {result.type}
              </span>
              <h4 className="font-medium text-grey-900">{highlightMatch(result.title, query)}</h4>
            </div>
            <p className="text-sm text-grey-600 line-clamp-2">{highlightMatch(result.content, query)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyboardShortcutTable({ shortcuts }: { shortcuts: typeof keyboardShortcuts }) {
  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h4 className="font-medium text-grey-700 mb-3 flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            {category}
          </h4>
          <div className="overflow-hidden rounded-xl border border-grey-200 bg-white">
            <table className="w-full">
              <tbody className="divide-y divide-grey-100">
                {shortcuts.filter(s => s.category === category).map((shortcut, index) => (
                  <tr key={index} className="bg-white transition-colors hover:bg-grey-50 group">
                    <td className="px-5 py-3 w-40">
                      <div className="flex items-center gap-1.5">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center">
                            <kbd className="rounded-lg bg-grey-100 px-2.5 py-1.5 text-xs font-semibold text-grey-700 shadow-sm ring-1 ring-grey-200">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-grey-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-grey-900">{shortcut.action}</td>
                    <td className="hidden sm:table-cell px-5 py-3 text-grey-600">{shortcut.description}</td>
                    <td className="px-3 py-3 w-12">
                      <CopyButton
                        text={shortcut.keys.join(" + ")}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("interface");
  const [faqCategory, setFaqCategory] = useState("All");
  const [faqAllExpanded, setFaqAllExpanded] = useState(false);

  const isSearching = searchQuery.length > 2;

  const navItems = [
    { id: "interface", label: "Interface Guide", icon: Layout },
    { id: "examples", label: "Example Conversations", icon: MessageCircle },
    { id: "how-to", label: "How To Guides", icon: BookOpen, isNew: true },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
    { id: "troubleshooting", label: "Troubleshooting", icon: AlertTriangle },
    { id: "glossary", label: "Glossary", icon: BookOpen },
    { id: "whats-new", label: "What's New", icon: Sparkles },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "account", label: "Account & Billing", icon: CreditCard },
    { id: "contact", label: "Contact Support", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/30 via-white to-grey-50/50">
      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-grey-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-all hover:bg-grey-100 hover:text-grey-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold text-grey-900">Help Center</h1>
          </div>
          <a
            href="mailto:support@sage-ai.com"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-sage-100 px-4 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-200"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-grey-100 bg-gradient-to-br from-sage-50 via-white to-sage-50/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(132,169,140,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(132,169,140,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-grey-200/50">
              <Sparkles className="h-4 w-4 text-sage-600" />
              <span className="text-sm font-medium text-grey-700">Welcome to Sage Help Center</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-grey-900 mb-4">
              How can we help you today?
            </h2>
            <p className="text-lg text-grey-600 mb-8 max-w-2xl mx-auto">
              Find answers, learn best practices, and get the most out of Sage.
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help articles, FAQs, tips..."
                className="w-full rounded-2xl border border-grey-200 bg-white py-4 pl-14 pr-5 text-grey-900 shadow-lg shadow-grey-200/50 transition-all placeholder:text-grey-400 focus:border-sage-300 focus:outline-none focus:ring-4 focus:ring-sage-100/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-grey-400 hover:bg-grey-100 hover:text-grey-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Getting Started", "How To Guides", "Keyboard Shortcuts", "FAQ"].map((link) => (
                <button
                  key={link}
                  onClick={() => {
                    setSearchQuery("");
                    const sectionId = link.toLowerCase().replace(/ /g, "-");
                    if (sectionId === "getting-started") setActiveSection("interface");
                    else if (sectionId === "keyboard-shortcuts") setActiveSection("shortcuts");
                    else setActiveSection(sectionId);
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-grey-600 shadow-sm ring-1 ring-grey-200 transition-all hover:bg-sage-50 hover:text-sage-700 hover:ring-sage-200"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div className="py-8">
          <SearchResults query={searchQuery} onClear={() => setSearchQuery("")} />
        </div>
      ) : (
        <>
          {/* Quick Start Section */}
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-grey-900 mb-2">Quick Start Guide</h3>
              <p className="text-grey-600">Get up and running with Sage in 4 simple steps</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickStartSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="group relative overflow-hidden rounded-2xl border border-grey-200 bg-white p-6 transition-all hover:border-sage-200 hover:shadow-lg"
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sage-50 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-grey-100 text-sm font-bold text-grey-600">
                          {step.step}
                        </span>
                      </div>
                      <h4 className="font-semibold text-grey-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-grey-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="border-y border-grey-100 bg-grey-50/50 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-8 text-center">
                <h3 className="font-serif text-2xl font-bold text-grey-900 mb-2">What Can Sage Help With?</h3>
                <p className="text-grey-600">Explore different ways to use Sage with example prompts</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {useCases.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.category}
                      className="group rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:shadow-md hover:border-sage-200"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                            <Icon className="h-5 w-5 text-sage-600" />
                          </div>
                          <h4 className="font-semibold text-grey-900">{category.category}</h4>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {category.examples.slice(0, 3).map((example, i) => (
                          <li key={i} className="group/item flex items-start gap-2 text-sm text-grey-600">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-sage-400 flex-shrink-0" />
                            <span className="line-clamp-1 flex-1">"{example}"</span>
                            <CopyButton
                              text={example}
                              className="opacity-0 group-hover/item:opacity-100 h-6 w-6"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pro Tips Section */}
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-grey-900 mb-2">Pro Tips</h3>
              <p className="text-grey-600">Get the most out of Sage with these expert tips</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {proTips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <div
                    key={tip.tip}
                    className="flex gap-4 rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:border-sage-200 hover:shadow-sm"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sage-100 to-sage-50">
                      <Icon className="h-6 w-6 text-sage-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-grey-900 mb-1">{tip.tip}</h4>
                      <p className="text-sm text-grey-600">{tip.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advanced Tips */}
            <div className="rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50 to-white p-6">
              <h4 className="font-semibold text-sage-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-sage-600" />
                Advanced Tips
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {advancedTips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div key={tip.tip} className="flex gap-3">
                      <Icon className="h-5 w-5 text-sage-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sage-800">{tip.tip}</p>
                        <p className="text-sm text-sage-600">{tip.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="border-t border-grey-100 bg-grey-50/30 py-12">
            <div className="mx-auto max-w-6xl px-4">
              <div className="grid gap-8 lg:grid-cols-4">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                  <div className="sticky top-20 space-y-6">
                    <div>
                      <h4 className="font-semibold text-grey-900 mb-4 px-2">Help Topics</h4>
                      <nav className="space-y-1">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveSection(item.id)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                                activeSection === item.id
                                  ? "bg-sage-100 text-sage-800"
                                  : "text-grey-600 hover:bg-grey-100 hover:text-grey-900"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                              {item.isNew && (
                                <span className="ml-auto rounded-full bg-sage-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  NEW
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Onboarding Checklist */}
                    <OnboardingChecklist />
                  </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                  {/* Interface Guide */}
                  {activeSection === "interface" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Interface Guide</h3>
                      <p className="text-grey-600 mb-6">Learn your way around Sage's interface</p>

                      <div className="space-y-6">
                        {interfaceGuide.map((section) => {
                          const Icon = section.icon;
                          return (
                            <div key={section.id} className="rounded-2xl border border-grey-200 bg-white overflow-hidden">
                              <div className="flex items-center gap-4 border-b border-grey-100 bg-grey-50 px-6 py-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100">
                                  <Icon className="h-6 w-6 text-sage-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-grey-900">{section.title}</h4>
                                  <p className="text-sm text-grey-600">{section.description}</p>
                                </div>
                              </div>
                              <div className="p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  {section.features.map((feature, i) => (
                                    <div key={i} className="flex gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-sage-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-grey-900">{feature.name}</p>
                                        <p className="text-sm text-grey-600">{feature.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <WasThisHelpful section="interface" />
                    </div>
                  )}

                  {/* Example Conversations */}
                  {activeSection === "examples" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Example Conversations</h3>
                      <p className="text-grey-600 mb-6">See how Sage responds to different types of requests</p>

                      <div className="space-y-6">
                        {exampleConversations.map((example, index) => (
                          <ExampleConversation key={index} example={example} />
                        ))}
                      </div>

                      <div className="mt-8 rounded-2xl border border-sage-200 bg-sage-50 p-6">
                        <h4 className="font-semibold text-sage-900 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Understanding the Difference
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl bg-white p-4 border border-sage-200">
                            <p className="font-medium text-sage-800 mb-2 flex items-center gap-2">
                              <ListChecks className="h-4 w-4" />
                              Actionable Requests
                            </p>
                            <p className="text-sm text-sage-600">
                              Tasks, questions, and requests that need structured help trigger plan generation.
                            </p>
                          </div>
                          <div className="rounded-xl bg-white p-4 border border-grey-200">
                            <p className="font-medium text-grey-800 mb-2 flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              Conversational Messages
                            </p>
                            <p className="text-sm text-grey-600">
                              Simple greetings and casual chat get friendly responses without plans.
                            </p>
                          </div>
                        </div>
                      </div>
                      <WasThisHelpful section="examples" />
                    </div>
                  )}

                  {/* How To Guides */}
                  {activeSection === "how-to" && (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-xl font-bold text-grey-900">How To Guides</h3>
                        <span className="rounded-full bg-sage-500 px-2 py-0.5 text-xs font-semibold text-white">NEW</span>
                      </div>
                      <p className="text-grey-600 mb-6">Step-by-step guides to master Sage</p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {howToGuides.map((guide) => {
                          const Icon = guide.icon;
                          return (
                            <div key={guide.title} className="rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:shadow-md hover:border-sage-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                                  <Icon className="h-5 w-5 text-sage-600" />
                                </div>
                                <h4 className="font-semibold text-grey-900">{guide.title}</h4>
                              </div>
                              <ul className="space-y-2.5">
                                {guide.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-grey-600">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-sage-500 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                      <WasThisHelpful section="how-to" />
                    </div>
                  )}

                  {/* FAQ */}
                  {activeSection === "faq" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Frequently Asked Questions</h3>
                      <p className="text-grey-600 mb-6">{faqs.length} questions answered</p>

                      {/* FAQ Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                          {faqCategories.map((category) => (
                            <button
                              key={category}
                              onClick={() => setFaqCategory(category)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                                faqCategory === category
                                  ? "bg-sage-500 text-white"
                                  : "bg-grey-100 text-grey-600 hover:bg-grey-200"
                              )}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        {/* Expand/Collapse All */}
                        <button
                          onClick={() => setFaqAllExpanded(!faqAllExpanded)}
                          className="flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700"
                        >
                          {faqAllExpanded ? (
                            <>
                              <Minimize2 className="h-4 w-4" />
                              Collapse All
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-4 w-4" />
                              Expand All
                            </>
                          )}
                        </button>
                      </div>

                      <FAQAccordion
                        items={faqs}
                        searchQuery=""
                        selectedCategory={faqCategory}
                        allExpanded={faqAllExpanded}
                      />
                      <WasThisHelpful section="faq" />
                    </div>
                  )}

                  {/* Keyboard Shortcuts */}
                  {activeSection === "shortcuts" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Keyboard Shortcuts</h3>
                      <p className="text-grey-600 mb-6">Master these shortcuts to navigate Sage like a pro. Hover over any row to copy the shortcut.</p>
                      <KeyboardShortcutTable shortcuts={keyboardShortcuts} />

                      <div className="mt-8 rounded-2xl border border-grey-200 bg-grey-50 p-6">
                        <h4 className="font-semibold text-grey-900 mb-3 flex items-center gap-2">
                          <Command className="h-5 w-5 text-sage-600" />
                          Platform Notes
                        </h4>
                        <ul className="space-y-2 text-grey-600">
                          <li className="flex items-start gap-2">
                            <span className="text-sage-500">•</span>
                            On Mac, use ⌘ (Command). On Windows/Linux, use Ctrl.
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-sage-500">•</span>
                            Some shortcuts may be overridden by your browser or OS.
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-sage-500">•</span>
                            Shortcuts work best when the chat input is not focused.
                          </li>
                        </ul>
                      </div>
                      <WasThisHelpful section="shortcuts" />
                    </div>
                  )}

                  {/* Troubleshooting */}
                  {activeSection === "troubleshooting" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Troubleshooting</h3>
                      <p className="text-grey-600 mb-6">Having issues? Find solutions to common problems below.</p>
                      <div className="space-y-4">
                        {troubleshootingItems.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <div key={index} className="rounded-2xl border border-grey-200 bg-white overflow-hidden">
                              <div className="flex items-center gap-3 border-b border-grey-100 bg-grey-50 px-5 py-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                                  <Icon className="h-4 w-4 text-grey-600" />
                                </div>
                                <h4 className="font-semibold text-grey-900">{item.problem}</h4>
                              </div>
                              <div className="px-5 py-4">
                                <ul className="space-y-2.5">
                                  {item.solutions.map((solution, i) => (
                                    <li key={i} className="flex items-start gap-3 text-grey-600">
                                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-sage-500 flex-shrink-0" />
                                      <span className="text-sm">{solution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <WasThisHelpful section="troubleshooting" />
                    </div>
                  )}

                  {/* Glossary */}
                  {activeSection === "glossary" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Glossary</h3>
                      <p className="text-grey-600 mb-6">Learn the terminology used throughout Sage.</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {glossaryTerms.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <div key={index} className="rounded-xl border border-grey-200 bg-white p-4 flex gap-4 transition-all hover:shadow-sm hover:border-sage-200">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-100 flex-shrink-0">
                                <Icon className="h-5 w-5 text-sage-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-grey-900 mb-1">{item.term}</h4>
                                <p className="text-sm text-grey-600">{item.definition}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <WasThisHelpful section="glossary" />
                    </div>
                  )}

                  {/* What's New */}
                  {activeSection === "whats-new" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">What's New</h3>
                      <p className="text-grey-600 mb-6">Latest updates and improvements to Sage.</p>
                      <div className="space-y-6">
                        {whatsNewItems.map((release, index) => (
                          <div key={index} className="rounded-2xl border border-grey-200 bg-white overflow-hidden">
                            <div className="flex items-center justify-between border-b border-grey-100 bg-grey-50 px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-semibold text-grey-900">{release.title}</h4>
                                  <p className="text-sm text-grey-600">Version {release.version}</p>
                                </div>
                                {release.isNew && (
                                  <span className="rounded-full bg-sage-500 px-2 py-0.5 text-xs font-semibold text-white">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
                                {release.date}
                              </span>
                            </div>
                            <div className="p-6">
                              <ul className="space-y-2">
                                {release.highlights.map((highlight, i) => (
                                  <li key={i} className="flex items-center gap-3 text-grey-600">
                                    <Sparkles className="h-4 w-4 text-sage-500" />
                                    {highlight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                      <WasThisHelpful section="whats-new" />
                    </div>
                  )}

                  {/* Privacy & Security */}
                  {activeSection === "privacy" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Privacy & Security</h3>
                      <p className="text-grey-600 mb-6">How we protect your data and privacy.</p>

                      <div className="grid gap-4 sm:grid-cols-2 mb-8">
                        {privacyFeatures.map((feature, index) => {
                          const Icon = feature.icon;
                          return (
                            <div key={index} className="rounded-xl border border-grey-200 bg-white p-5 flex gap-4 transition-all hover:shadow-sm hover:border-sage-200">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 flex-shrink-0">
                                <Icon className="h-6 w-6 text-sage-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-grey-900 mb-1">{feature.title}</h4>
                                <p className="text-sm text-grey-600">{feature.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-grey-200 bg-white p-6">
                        <h4 className="font-semibold text-grey-900 mb-4">Data Handling Practices</h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-sage-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-grey-900">Encrypted Storage</p>
                              <p className="text-sm text-grey-600">All conversations are encrypted at rest using industry-standard encryption.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-sage-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-grey-900">Secure Transmission</p>
                              <p className="text-sm text-grey-600">All data is transmitted over HTTPS with TLS 1.3 encryption.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-sage-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-grey-900">Data Deletion</p>
                              <p className="text-sm text-grey-600">You can delete any task at any time. Deleted data is permanently removed.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-sage-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-grey-900">No Third-Party Sharing</p>
                              <p className="text-sm text-grey-600">We never share your conversation data with third parties for marketing or other purposes.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <WasThisHelpful section="privacy" />
                    </div>
                  )}

                  {/* Account & Billing */}
                  {activeSection === "account" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Account & Billing</h3>

                      <div className="space-y-6">
                        <div className="rounded-2xl border border-grey-200 bg-white p-6">
                          <h4 className="font-semibold text-grey-900 mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-sage-600" />
                            Free Plan
                          </h4>
                          <ul className="space-y-3">
                            {[
                              "50 tasks per day (resets at midnight)",
                              "Unlimited messages within each task",
                              "Access to all core features",
                              "Image attachments",
                              "Task history & starring",
                            ].map((feature, i) => (
                              <li key={i} className="flex items-center gap-3 text-grey-600">
                                <CheckCircle2 className="h-4 w-4 text-sage-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sage-900 flex items-center gap-2">
                              <Rocket className="h-5 w-5 text-sage-600" />
                              Pro Plan
                            </h4>
                            <span className="rounded-full bg-sage-200 px-3 py-1 text-xs font-semibold text-sage-800">
                              Coming Soon
                            </span>
                          </div>
                          <ul className="space-y-3 mb-6">
                            {[
                              "Unlimited tasks",
                              "Priority response times",
                              "Advanced AI capabilities",
                              "Priority support",
                              "Early access to new features",
                              "API access",
                              "Team collaboration (coming soon)",
                            ].map((feature, i) => (
                              <li key={i} className="flex items-center gap-3 text-sage-700">
                                <CheckCircle2 className="h-4 w-4 text-sage-600" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-grey-200 bg-grey-50 p-6">
                          <h4 className="font-semibold text-grey-900 mb-4">Account Management</h4>
                          <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-grey-600">
                              <ChevronRight className="h-5 w-5 text-sage-500 flex-shrink-0" />
                              <span>To change your email or password, go to Settings from the sidebar</span>
                            </li>
                            <li className="flex items-start gap-3 text-grey-600">
                              <ChevronRight className="h-5 w-5 text-sage-500 flex-shrink-0" />
                              <span>To delete your account, contact support@sage-ai.com</span>
                            </li>
                            <li className="flex items-start gap-3 text-grey-600">
                              <ChevronRight className="h-5 w-5 text-sage-500 flex-shrink-0" />
                              <span>Daily task limits reset at midnight in your local timezone</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <WasThisHelpful section="account" />
                    </div>
                  )}

                  {/* Contact */}
                  {activeSection === "contact" && (
                    <div className="animate-fade-in">
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-2">Contact Support</h3>
                      <p className="text-grey-600 mb-6">Need more help? We're here for you. Choose the best way to reach us.</p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <a
                          href="https://github.com/aidanmarr1/sage-ai/issues"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:border-sage-200 hover:shadow-md group"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-grey-900 group-hover:scale-105 transition-transform">
                            <Github className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-grey-900 flex items-center gap-2">
                              Report an Issue
                              <ExternalLink className="h-3.5 w-3.5 text-grey-400" />
                            </p>
                            <p className="text-sm text-grey-600">Found a bug? Let us know on GitHub</p>
                          </div>
                        </a>

                        <a
                          href="mailto:support@sage-ai.com"
                          className="flex items-start gap-4 rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:border-sage-200 hover:shadow-md group"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 group-hover:scale-105 transition-transform">
                            <Mail className="h-6 w-6 text-sage-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-grey-900">Email Support</p>
                            <p className="text-sm text-grey-600">support@sage-ai.com</p>
                          </div>
                        </a>

                        <a
                          href="https://github.com/aidanmarr1/sage-ai/discussions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:border-sage-200 hover:shadow-md group"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 group-hover:scale-105 transition-transform">
                            <Users className="h-6 w-6 text-sage-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-grey-900 flex items-center gap-2">
                              Community
                              <ExternalLink className="h-3.5 w-3.5 text-grey-400" />
                            </p>
                            <p className="text-sm text-grey-600">Join discussions and share ideas</p>
                          </div>
                        </a>

                        <a
                          href="https://github.com/aidanmarr1/sage-ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:border-sage-200 hover:shadow-md group"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 group-hover:scale-105 transition-transform">
                            <Lightbulb className="h-6 w-6 text-sage-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-grey-900 flex items-center gap-2">
                              Feature Requests
                              <ExternalLink className="h-3.5 w-3.5 text-grey-400" />
                            </p>
                            <p className="text-sm text-grey-600">Suggest new features for Sage</p>
                          </div>
                        </a>
                      </div>

                      <div className="mt-8 rounded-2xl border border-grey-200 bg-grey-50 p-6 text-center">
                        <Clock className="h-8 w-8 text-sage-500 mx-auto mb-3" />
                        <h4 className="font-semibold text-grey-900 mb-2">Response Times</h4>
                        <p className="text-grey-600 text-sm">
                          We typically respond to support requests within 24-48 hours.
                          <br />
                          Pro users receive priority support with faster response times.
                        </p>
                      </div>
                      <WasThisHelpful section="contact" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-grey-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-grey-600">
              <Heart className="h-4 w-4 text-sage-500" />
              <span className="text-sm">Built with care by the Sage team</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="mailto:support@sage-ai.com" className="text-sm text-grey-600 hover:text-sage-600">
                Contact
              </a>
              <a href="https://github.com/aidanmarr1/sage-ai" target="_blank" rel="noopener noreferrer" className="text-sm text-grey-600 hover:text-sage-600">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
