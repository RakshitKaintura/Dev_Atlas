"use client";

import { useState } from "react";
import { SendHorizontal, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

const QUICK_ACTIONS = [
  { label: "🔍 Explain Code", prompt: "Explain the selected code clearly. Describe what it does, how it works, its dependencies, and any important edge cases." },
  { label: "🐛 Find Bugs", prompt: "Analyze the relevant code for bugs, logical errors, incorrect assumptions, and edge cases. Identify the root cause and suggest specific fixes." },
  { label: "🧪 Generate Tests", prompt: "Generate comprehensive unit tests for the relevant code, including happy paths, edge cases, error cases, and important boundary conditions." },
  { label: "🔐 Security Audit", prompt: "Audit the relevant code for security vulnerabilities, including authentication, authorization, injection, data exposure, insecure configurations, and common OWASP risks. Explain the impact and recommended fix for each finding." },
  { label: "♻️ Refactor Code", prompt: "Review the relevant code and suggest a cleaner, more maintainable refactoring while preserving its existing behavior. Focus on readability, duplication, complexity, and separation of concerns." },
  { label: "⚡ Optimize Perf", prompt: "Analyze the relevant code for performance bottlenecks. Identify expensive operations, unnecessary work, inefficient queries or API calls, and suggest measurable optimizations." },
  { label: "🏗️ Explain Arch", prompt: "Analyze the repository structure and explain the application's architecture, major components, responsibilities, dependencies, and the flow of data between them." },
  { label: "📝 Improve Docs", prompt: "Analyze the relevant code and generate clear developer-focused documentation explaining its purpose, usage, inputs, outputs, dependencies, and important implementation details." },
  { label: "🔄 Trace Flow", prompt: "Trace how this functionality works through the codebase. Identify the entry point, important functions/classes, dependencies, data transformations, and final output." },
  { label: "💡 Suggestions", prompt: "Review the relevant code and identify the most important improvements for reliability, maintainability, security, performance, and developer experience. Prioritize the changes by impact." },
];

export function ChatComposer({
  disabled,
  streaming,
  onSend,
  onStop,
}: {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (content: string) => void | Promise<void>;
  onStop?: () => void;
}) {
  const [value, setValue] = useState("");

  async function submit(overrideText?: string) {
    const content = (overrideText ?? value).trim();
    if (!content || disabled || streaming) return;
    setValue("");
    await onSend(content);
  }

  return (
    <div className="border-t bg-background/80 p-4 backdrop-blur">
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Quick Actions Scrollable Row */}
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={disabled || streaming}
              onClick={() => void submit(action.prompt)}
              className="shrink-0 rounded-full border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-xs">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about architecture, files, flows…"
            disabled={disabled}
            className="min-h-12 flex-1 border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          {streaming ? (
            <Button
              size="icon-lg"
              variant="secondary"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon-lg"
              disabled={disabled || !value.trim()}
              onClick={() => void submit()}
              aria-label="Send message"
            >
              {disabled ? <Spinner /> : <SendHorizontal />}
            </Button>
          )}
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          Press <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd>{" "}
          for a new line
        </p>
      </div>
    </div>
  );
}
