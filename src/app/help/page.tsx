"use client";

import { useState, useMemo } from "react";
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

const faqs = [
  {
    question: "What exactly is Sage?",
    answer: "Sage is a general-purpose AI agent - not just a chatbot. It can understand complex requests, create actionable plans, and help you work through multi-step problems. Whether you need help with research, writing, coding, planning, or creative tasks, Sage adapts to your needs and provides intelligent assistance.",
  },
  {
    question: "What's the difference between Sage and other AI chatbots?",
    answer: "Unlike simple chatbots that just respond to messages, Sage is designed as an AI agent that can plan, reason, and execute tasks. When you give Sage an actionable request, it creates a structured plan with clear steps. Sage also has access to workspace tools like a terminal, file browser, and visual display for more complex tasks.",
  },
  {
    question: "Why doesn't every message create a plan?",
    answer: "Sage is smart enough to distinguish between casual conversation and actionable requests. If you say 'hi' or 'how are you', Sage responds conversationally. But when you ask something like 'help me write a business plan' or 'research the best laptops under $1000', Sage recognizes this as a task and generates a structured plan to help you accomplish it.",
  },
  {
    question: "Can Sage remember our previous conversations?",
    answer: "Yes! Each task/conversation is saved to your account. When you click on a task in the sidebar, Sage loads the entire conversation history. This means you can pick up where you left off, ask follow-up questions, or continue working on the same project days later.",
  },
  {
    question: "What types of files can I attach?",
    answer: "Currently, Sage supports image attachments (PNG, JPG, GIF, WebP, etc.). You can attach images by clicking the paperclip icon or by dragging and dropping directly into the chat. This is great for getting feedback on designs, explaining visual concepts, or sharing screenshots.",
  },
  {
    question: "Is there a limit to how much I can use Sage?",
    answer: "The Free Plan includes 50 tasks per day, which resets at midnight. Each task can have unlimited messages within it. If you need more, you can upgrade to Pro for unlimited tasks and additional features.",
  },
  {
    question: "How is my data protected?",
    answer: "Your conversations are private and encrypted. Only you can access your tasks when signed in. We don't share your conversation data with third parties or use it to train models without consent. You can delete any task at any time.",
  },
  {
    question: "Can I use Sage for work/commercial purposes?",
    answer: "Absolutely! Sage is designed for both personal and professional use. Many users rely on Sage for business tasks like writing proposals, analyzing data, planning projects, and more. The Pro plan is especially suited for professional use with unlimited tasks.",
  },
  {
    question: "What should I do if Sage gives an incorrect answer?",
    answer: "While Sage strives for accuracy, it can sometimes make mistakes. If you notice an error, simply point it out in the conversation - say something like 'That's not quite right, can you reconsider?' Sage will acknowledge the feedback and provide a corrected response.",
  },
  {
    question: "Can Sage browse the internet or access external websites?",
    answer: "Sage has knowledge up to its training date and can provide information based on that. For the most current information on rapidly changing topics, it's always good to verify with up-to-date sources. Sage can help you understand what to look for and how to evaluate information.",
  },
  {
    question: "How do I get the best results from Sage?",
    answer: "Be specific and provide context! Instead of 'write an email', try 'write a professional email to my manager requesting a meeting to discuss my project timeline, keeping a friendly but formal tone'. The more details you provide about your goals, audience, and constraints, the better Sage can help.",
  },
  {
    question: "Can multiple people use the same Sage account?",
    answer: "Each Sage account is designed for individual use. For teams and organizations, we're working on team plans that will allow collaboration features. For now, each person should have their own account for the best experience.",
  },
];

const keyboardShortcuts = [
  { keys: ["⌘", "N"], action: "New Task", description: "Start a new task/conversation" },
  { keys: ["⌘", "K"], action: "Search", description: "Open search dialog" },
  { keys: ["⌘", "B"], action: "Toggle Sidebar", description: "Collapse or expand the sidebar" },
  { keys: ["⌘", "\\"], action: "Toggle Workspace", description: "Show or hide the workspace panel" },
  { keys: ["Enter"], action: "Send Message", description: "Send your current message" },
  { keys: ["Shift", "Enter"], action: "New Line", description: "Add a new line without sending" },
  { keys: ["⌘", "↑"], action: "Previous Message", description: "Edit your previous message" },
  { keys: ["Esc"], action: "Cancel", description: "Cancel current action or close dialogs" },
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
];

const glossaryTerms = [
  { term: "Task", definition: "A conversation or project in Sage. Each time you start something new, it creates a task that's saved to your sidebar." },
  { term: "Plan", definition: "A structured, step-by-step breakdown that Sage creates for actionable requests. Plans help organize complex tasks into manageable steps." },
  { term: "Workspace", definition: "The right panel containing Computer, Plan, Terminal, and Files tabs. This is where Sage's tools and outputs are displayed." },
  { term: "Agent", definition: "Sage is an AI agent - more than a chatbot. Agents can plan, reason, use tools, and complete multi-step tasks autonomously." },
  { term: "Actionable Request", definition: "A message that asks Sage to do something specific, like writing, researching, or planning. These trigger plan generation." },
  { term: "Conversational Message", definition: "Casual messages like greetings that don't require a structured response or plan." },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function FAQAccordion({ items, searchQuery }: { items: typeof faqs; searchQuery: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  if (filteredItems.length === 0) {
    return (
      <div className="rounded-xl border border-grey-200 bg-grey-50 p-6 text-center">
        <p className="text-grey-600">No matching questions found. Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredItems.map((item, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-grey-200 bg-white transition-shadow hover:shadow-sm"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-grey-50"
          >
            <span className="font-medium text-grey-900 pr-4">{item.question}</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 flex-shrink-0 text-grey-400 transition-transform duration-200",
                openIndex === index && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-200",
              openIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="border-t border-grey-100 bg-grey-50/50 px-5 py-4">
                <p className="text-grey-600 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
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
  ];

  const results = allContent.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase())
  );

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
        {results.slice(0, 10).map((result, index) => (
          <div
            key={index}
            className="rounded-xl border border-grey-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">
                {result.type}
              </span>
              <h4 className="font-medium text-grey-900">{result.title}</h4>
            </div>
            <p className="text-sm text-grey-600 line-clamp-2">{result.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>("quick-start");

  const isSearching = searchQuery.length > 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/30 via-white to-grey-50/50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-grey-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
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
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-grey-200/50">
              <Sparkles className="h-4 w-4 text-sage-600" />
              <span className="text-sm font-medium text-grey-700">Welcome to Sage Help Center</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-grey-900 mb-4">
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
          <div className="mx-auto max-w-5xl px-4 py-12">
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
            <div className="mx-auto max-w-5xl px-4">
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
                      className="rounded-2xl border border-grey-200 bg-white p-5 transition-all hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                          <Icon className="h-5 w-5 text-sage-600" />
                        </div>
                        <h4 className="font-semibold text-grey-900">{category.category}</h4>
                      </div>
                      <ul className="space-y-2">
                        {category.examples.slice(0, 3).map((example, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-grey-600">
                            <ChevronRight className="h-4 w-4 mt-0.5 text-sage-400 flex-shrink-0" />
                            <span className="line-clamp-1">"{example}"</span>
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
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="mb-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-grey-900 mb-2">Pro Tips</h3>
              <p className="text-grey-600">Get the most out of Sage with these expert tips</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>

          {/* Main Content Sections */}
          <div className="border-t border-grey-100 bg-grey-50/30 py-12">
            <div className="mx-auto max-w-5xl px-4">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                  <div className="sticky top-20">
                    <h4 className="font-semibold text-grey-900 mb-4 px-2">Help Topics</h4>
                    <nav className="space-y-1">
                      {[
                        { id: "faq", label: "Frequently Asked Questions", icon: HelpCircle },
                        { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
                        { id: "troubleshooting", label: "Troubleshooting", icon: AlertTriangle },
                        { id: "glossary", label: "Glossary", icon: BookOpen },
                        { id: "account", label: "Account & Billing", icon: CreditCard },
                        { id: "contact", label: "Contact Support", icon: Mail },
                      ].map((item) => {
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
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-2">
                  {/* FAQ */}
                  {activeSection === "faq" && (
                    <div>
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Frequently Asked Questions</h3>
                      <FAQAccordion items={faqs} searchQuery="" />
                    </div>
                  )}

                  {/* Keyboard Shortcuts */}
                  {activeSection === "shortcuts" && (
                    <div>
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Keyboard Shortcuts</h3>
                      <p className="text-grey-600 mb-6">Master these shortcuts to navigate Sage like a pro.</p>
                      <div className="overflow-hidden rounded-2xl border border-grey-200 bg-white">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-grey-100 bg-grey-50">
                              <th className="px-5 py-3 text-left text-sm font-semibold text-grey-700">Shortcut</th>
                              <th className="px-5 py-3 text-left text-sm font-semibold text-grey-700">Action</th>
                              <th className="hidden sm:table-cell px-5 py-3 text-left text-sm font-semibold text-grey-700">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-grey-100">
                            {keyboardShortcuts.map((shortcut, index) => (
                              <tr key={index} className="bg-white transition-colors hover:bg-grey-50">
                                <td className="px-5 py-3">
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Troubleshooting */}
                  {activeSection === "troubleshooting" && (
                    <div>
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Troubleshooting</h3>
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
                    </div>
                  )}

                  {/* Glossary */}
                  {activeSection === "glossary" && (
                    <div>
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Glossary</h3>
                      <p className="text-grey-600 mb-6">Learn the terminology used throughout Sage.</p>
                      <div className="space-y-3">
                        {glossaryTerms.map((item, index) => (
                          <div key={index} className="rounded-xl border border-grey-200 bg-white p-4">
                            <h4 className="font-semibold text-grey-900 mb-1">{item.term}</h4>
                            <p className="text-sm text-grey-600">{item.definition}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account & Billing */}
                  {activeSection === "account" && (
                    <div>
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
                            ].map((feature, i) => (
                              <li key={i} className="flex items-center gap-3 text-sage-700">
                                <CheckCircle2 className="h-4 w-4 text-sage-600" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {activeSection === "contact" && (
                    <div>
                      <h3 className="font-serif text-xl font-bold text-grey-900 mb-6">Contact Support</h3>
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
        <div className="mx-auto max-w-5xl px-4">
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
