"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/cn";

interface FAQItem {
  question: string;
  answer: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "What can Sage help with?",
    answer: "Sage is a general-purpose AI agent that can help with research and information gathering, writing and content creation, analysis and problem-solving, task automation, code assistance, brainstorming, planning, and much more. Think of Sage as your intelligent assistant for any task that requires thinking, research, or creation.",
  },
  {
    question: "Why didn't my task create a plan?",
    answer: "Sage distinguishes between conversational messages and actionable tasks. Simple greetings like 'hi' or 'hello' receive friendly conversational responses without generating a plan. When you send an actionable request like 'help me write a blog post' or 'research the best laptops', Sage will acknowledge your request and generate a step-by-step plan.",
  },
  {
    question: "How do I switch between tasks?",
    answer: "Your recent tasks appear in the sidebar under the 'Recent' section. Simply click on any task to switch to it. The task will load with all your previous messages and any associated plan.",
  },
  {
    question: "What's the difference between Chat and Plan tabs?",
    answer: "The Chat panel shows your conversation with Sage - your messages and Sage's responses. The Plan tab in the workspace shows the step-by-step breakdown that Sage creates for actionable tasks. Not all conversations will have a plan - only actionable requests trigger plan generation.",
  },
  {
    question: "How do I delete a task?",
    answer: "Hover over any task in the sidebar's Recent section. You'll see a trash icon appear on the right side. Click it to delete the task. Note: This action cannot be undone.",
  },
  {
    question: "How do I star/favorite a task?",
    answer: "Hover over any task in the sidebar's Recent section. You'll see a star icon appear. Click it to star the task. Starred tasks are marked with a filled star icon for easy identification.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes, all your conversations are private to your account. Your data is stored securely and is only accessible when you're signed in. We do not share your conversation data with third parties.",
  },
  {
    question: "What are the message limits?",
    answer: "Each message can be up to 4,000 characters. You can also attach images to your messages. The Free Plan allows up to 50 tasks per day.",
  },
  {
    question: "Can I use Sage on mobile?",
    answer: "Yes, Sage is fully responsive and works on mobile devices. The interface adapts to smaller screens, with the sidebar collapsing to give you more space for the chat and workspace.",
  },
  {
    question: "How do I get more tasks per day?",
    answer: "The Free Plan includes 50 tasks per day. To get unlimited tasks and additional features, you can upgrade to the Pro plan from the user menu in the sidebar.",
  },
];

const keyboardShortcuts = [
  { keys: ["⌘", "N"], action: "New Task", description: "Start a new task/conversation" },
  { keys: ["⌘", "K"], action: "Search", description: "Open search" },
  { keys: ["⌘", "B"], action: "Toggle Sidebar", description: "Collapse or expand the sidebar" },
  { keys: ["Enter"], action: "Send Message", description: "Send your current message" },
  { keys: ["Shift", "Enter"], action: "New Line", description: "Add a new line in your message" },
  { keys: ["H"], action: "Home", description: "Go to Home" },
  { keys: ["T"], action: "Tasks", description: "Go to Tasks" },
  { keys: ["Y"], action: "History", description: "Go to History" },
  { keys: ["?"], action: "Help", description: "Open Help & Support" },
  { keys: [","], action: "Settings", description: "Open Settings" },
];

const troubleshootingItems = [
  {
    problem: "Messages not sending",
    solutions: [
      "Check your internet connection",
      "Try refreshing the page (⌘ + R)",
      "Make sure you're signed in",
      "Check if you've exceeded the daily task limit",
    ],
  },
  {
    problem: "Tasks not appearing in sidebar",
    solutions: [
      "Ensure you're signed in to your account",
      "Try refreshing the page",
      "Check if the sidebar is expanded (⌘ + B to toggle)",
    ],
  },
  {
    problem: "Plan not generating",
    solutions: [
      "Make sure your request is actionable (not just a greeting)",
      "Try rephrasing your request to be more specific",
      "Example: Instead of 'hi', try 'help me write a blog post about AI'",
    ],
  },
  {
    problem: "Sidebar navigation not working",
    solutions: [
      "Hard refresh the page (⌘ + Shift + R)",
      "Clear your browser cache",
      "Try a different browser",
    ],
  },
  {
    problem: "Images not uploading",
    solutions: [
      "Check that the file is an image format (PNG, JPG, GIF, etc.)",
      "Ensure the file size isn't too large",
      "Try a different image",
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-grey-200 bg-white"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-grey-50"
          >
            <span className="font-medium text-grey-900">{item.question}</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-grey-400 transition-transform",
                openIndex === index && "rotate-180"
              )}
            />
          </button>
          {openIndex === index && (
            <div className="border-t border-grey-100 bg-grey-50/50 px-4 py-3">
              <p className="text-grey-600 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections: Section[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">What is Sage?</h3>
            <p className="text-grey-600 leading-relaxed">
              Sage is a general-purpose AI agent designed to help you with a wide variety of tasks.
              Unlike simple chatbots, Sage can understand complex requests, create actionable plans,
              and work through multi-step problems. Whether you need help with research, writing,
              analysis, or creative tasks, Sage is here to assist.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Creating Your First Task</h3>
            <ol className="space-y-3 text-grey-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-medium text-sage-700">1</span>
                <span>Click the "New Task" button in the sidebar or press <kbd className="rounded bg-grey-100 px-1.5 py-0.5 text-xs font-mono">⌘ N</kbd></span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-medium text-sage-700">2</span>
                <span>Type your request in the chat input at the bottom of the screen</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-medium text-sage-700">3</span>
                <span>Press Enter or click the send button to submit</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-medium text-sage-700">4</span>
                <span>Sage will acknowledge your request and generate a plan if it's an actionable task</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Understanding the Interface</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-grey-200 bg-grey-50/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100">
                    <MessageSquare className="h-4 w-4 text-sage-600" />
                  </div>
                  <span className="font-medium text-grey-900">Chat Panel</span>
                </div>
                <p className="text-sm text-grey-600">The left side shows your conversation with Sage. Send messages and view responses here.</p>
              </div>
              <div className="rounded-xl border border-grey-200 bg-grey-50/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100">
                    <Monitor className="h-4 w-4 text-sage-600" />
                  </div>
                  <span className="font-medium text-grey-900">Workspace</span>
                </div>
                <p className="text-sm text-grey-600">The right side contains tabs for Computer, Plan, Terminal, and Files.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Signing Up & Logging In</h3>
            <p className="text-grey-600 leading-relaxed">
              To save your tasks and access them across devices, create an account or sign in.
              Click on the user section at the bottom of the sidebar to access authentication options.
              Your conversations are private and only accessible when signed in.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "features",
      title: "Core Features",
      icon: ListChecks,
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sage-600" />
              Chat Interface
            </h3>
            <div className="space-y-4 text-grey-600">
              <p className="leading-relaxed">
                The chat interface is where you communicate with Sage. Here's what you can do:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Send messages:</strong> Type in the input field and press Enter</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Multi-line messages:</strong> Press Shift+Enter for new lines</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Attach images:</strong> Click the paperclip icon or drag & drop</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Add emojis:</strong> Click the smile icon to open the emoji picker</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Character limit:</strong> Messages can be up to 4,000 characters</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-sage-600" />
              Tasks & Conversations
            </h3>
            <div className="space-y-4 text-grey-600">
              <p className="leading-relaxed">
                Every conversation with Sage is saved as a task. Manage your tasks from the sidebar:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-grey-200 bg-white p-3">
                  <Plus className="h-5 w-5 text-sage-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-grey-900">Create New</p>
                    <p className="text-sm">Click "New Task" or press ⌘N</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-grey-200 bg-white p-3">
                  <Star className="h-5 w-5 text-sage-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-grey-900">Star Tasks</p>
                    <p className="text-sm">Hover and click star icon</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-grey-200 bg-white p-3">
                  <Trash2 className="h-5 w-5 text-sage-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-grey-900">Delete Tasks</p>
                    <p className="text-sm">Hover and click trash icon</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-grey-200 bg-white p-3">
                  <MessageSquare className="h-5 w-5 text-sage-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-grey-900">Switch Tasks</p>
                    <p className="text-sm">Click any task in Recent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-sage-600" />
              Plans
            </h3>
            <div className="space-y-4 text-grey-600">
              <p className="leading-relaxed">
                When you send an actionable request, Sage creates a plan with step-by-step guidance:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>Automatic generation:</strong> Plans are created for actionable tasks, not greetings</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>4-6 steps:</strong> Plans are concise and focused on key milestones</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-1 text-sage-500" />
                  <span><strong>View in workspace:</strong> Click the "Plan" tab to see the full plan</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-sage-600" />
              Workspace Tabs
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-grey-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-sage-600" />
                  <span className="font-medium text-grey-900">Computer</span>
                </div>
                <p className="text-sm text-grey-600">View the agent's visual workspace and screen display.</p>
              </div>
              <div className="rounded-xl border border-grey-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-sage-600" />
                  <span className="font-medium text-grey-900">Plan</span>
                </div>
                <p className="text-sm text-grey-600">View the step-by-step plan for your current task.</p>
              </div>
              <div className="rounded-xl border border-grey-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-sage-600" />
                  <span className="font-medium text-grey-900">Terminal</span>
                </div>
                <p className="text-sm text-grey-600">See command execution output and logs.</p>
              </div>
              <div className="rounded-xl border border-grey-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-sage-600" />
                  <span className="font-medium text-grey-900">Files</span>
                </div>
                <p className="text-sm text-grey-600">Browse files in the agent's workspace.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      content: (
        <div className="space-y-4">
          <p className="text-grey-600">
            Use these keyboard shortcuts to navigate Sage more efficiently:
          </p>
          <div className="overflow-hidden rounded-xl border border-grey-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-grey-200 bg-grey-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-grey-700">Shortcut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-grey-700">Action</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium text-grey-700 sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {keyboardShortcuts.map((shortcut, index) => (
                  <tr key={index} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i}>
                            <kbd className="rounded-md bg-grey-100 px-2 py-1 text-xs font-mono text-grey-700 shadow-sm ring-1 ring-grey-200">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && <span className="mx-1 text-grey-400">+</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-grey-900">{shortcut.action}</td>
                    <td className="hidden px-4 py-3 text-grey-600 sm:table-cell">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "account",
      title: "Account & Billing",
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Free Plan</h3>
            <div className="rounded-xl border border-grey-200 bg-grey-50/50 p-4">
              <ul className="space-y-2 text-grey-600">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-sage-500" />
                  <span>Up to 50 tasks per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-sage-500" />
                  <span>Access to all core features</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-sage-500" />
                  <span>Save and access your task history</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-sage-500" />
                  <span>Image attachments</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Upgrading to Pro</h3>
            <p className="text-grey-600 leading-relaxed mb-4">
              Need more? Upgrade to Pro for unlimited tasks and premium features.
              Click on your profile in the sidebar and select "Upgrade to Pro" to get started.
            </p>
            <div className="rounded-xl border-2 border-sage-200 bg-gradient-to-r from-sage-50 to-sage-100/50 p-4">
              <p className="font-medium text-sage-800">Pro Plan includes:</p>
              <ul className="mt-2 space-y-1 text-sage-700">
                <li>• Unlimited tasks</li>
                <li>• Priority response times</li>
                <li>• Advanced features</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold text-grey-900 mb-3">Managing Your Account</h3>
            <p className="text-grey-600 leading-relaxed">
              Access your account settings by clicking on your profile in the sidebar.
              From there you can update your profile, manage notifications, and view your usage.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      icon: HelpCircle,
      content: <FAQAccordion items={faqs} />,
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <p className="text-grey-600">
            Having issues? Here are solutions to common problems:
          </p>
          {troubleshootingItems.map((item, index) => (
            <div key={index} className="rounded-xl border border-grey-200 bg-white overflow-hidden">
              <div className="border-b border-grey-100 bg-grey-50 px-4 py-3">
                <h4 className="font-medium text-grey-900">{item.problem}</h4>
              </div>
              <div className="px-4 py-3">
                <ul className="space-y-2">
                  {item.solutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-2 text-grey-600">
                      <ChevronRight className="h-4 w-4 mt-1 text-sage-500 flex-shrink-0" />
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "contact",
      title: "Contact & Support",
      icon: Mail,
      content: (
        <div className="space-y-6">
          <p className="text-grey-600 leading-relaxed">
            Need more help? We're here for you. Choose the best way to reach us:
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://github.com/aidanmarr1/sage-ai/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-xl border border-grey-200 bg-white p-4 transition-all hover:border-sage-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-grey-900">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-grey-900">Report an Issue</p>
                <p className="text-sm text-grey-600">Found a bug? Let us know on GitHub</p>
              </div>
            </a>

            <a
              href="https://github.com/aidanmarr1/sage-ai/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-xl border border-grey-200 bg-white p-4 transition-all hover:border-sage-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                <MessageSquare className="h-5 w-5 text-sage-600" />
              </div>
              <div>
                <p className="font-medium text-grey-900">Community</p>
                <p className="text-sm text-grey-600">Join discussions and share ideas</p>
              </div>
            </a>

            <a
              href="https://github.com/aidanmarr1/sage-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-xl border border-grey-200 bg-white p-4 transition-all hover:border-sage-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                <Sparkles className="h-5 w-5 text-sage-600" />
              </div>
              <div>
                <p className="font-medium text-grey-900">Feature Requests</p>
                <p className="text-sm text-grey-600">Suggest new features</p>
              </div>
            </a>

            <a
              href="mailto:support@sage-ai.com"
              className="flex items-start gap-4 rounded-xl border border-grey-200 bg-white p-4 transition-all hover:border-sage-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100">
                <Mail className="h-5 w-5 text-sage-600" />
              </div>
              <div>
                <p className="font-medium text-grey-900">Email Support</p>
                <p className="text-sm text-grey-600">support@sage-ai.com</p>
              </div>
            </a>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-grey-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-grey-600 transition-colors hover:bg-grey-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-xl font-semibold text-grey-900">Help & Support</h1>
            <p className="text-sm text-grey-500">Everything you need to know about Sage</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full rounded-2xl border border-grey-200 bg-white py-4 pl-12 pr-4 text-grey-900 shadow-sm transition-all placeholder:text-grey-400 focus:border-sage-300 focus:outline-none focus:ring-4 focus:ring-sage-100"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sections.slice(0, 4).map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  activeSection === section.id
                    ? "border-sage-300 bg-sage-50 shadow-md"
                    : "border-grey-200 bg-white hover:border-sage-200 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  activeSection === section.id ? "bg-sage-200" : "bg-grey-100"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    activeSection === section.id ? "text-sage-700" : "text-grey-600"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  activeSection === section.id ? "text-sage-800" : "text-grey-700"
                )}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Sections */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = activeSection === section.id;

            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-2xl border border-grey-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => setActiveSection(isOpen ? null : section.id)}
                  className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-grey-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      isOpen ? "bg-sage-100" : "bg-grey-100"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isOpen ? "text-sage-600" : "text-grey-600"
                      )} />
                    </div>
                    <span className="font-serif text-lg font-semibold text-grey-900">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-grey-400 transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </button>

                {isOpen && (
                  <div className="border-t border-grey-100 px-6 py-6">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-grey-200 bg-grey-50/50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-grey-500">
            Can't find what you're looking for?{" "}
            <a href="mailto:support@sage-ai.com" className="text-sage-600 hover:text-sage-700">
              Contact us
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
