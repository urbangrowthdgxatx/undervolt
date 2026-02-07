"use client";

import { useState, useEffect } from "react";
import { Sparkles, Database, Brain, Check } from "lucide-react";

export interface ToolCall {
  type: "call" | "result";
  name: string;
  input?: unknown;
  result?: unknown;
  timestamp: number;
}

interface ToolCallsPanelProps {
  calls: ToolCall[];
  isLoading?: boolean;
  onClear?: () => void;
}

// Map technical names to friendly descriptions
function getFriendlyStatus(name: string, type: "call" | "result"): { icon: typeof Database; text: string; color: string } {
  if (type === "result") {
    return { icon: Check, text: "Found insights", color: "text-green-400" };
  }

  if (name.includes("supabase") || name.includes("query")) {
    return { icon: Database, text: "Searching permits...", color: "text-blue-400" };
  }
  if (name.includes("ollama") || name.includes("llm") || name.includes("generate")) {
    return { icon: Brain, text: "Analyzing patterns...", color: "text-purple-400" };
  }
  return { icon: Sparkles, text: "Processing...", color: "text-amber-400" };
}

export function ToolCallsPanel({ calls, isLoading }: ToolCallsPanelProps) {
  const [visible, setVisible] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<{ icon: typeof Database; text: string; color: string } | null>(null);

  // Show notification when loading or new calls come in
  useEffect(() => {
    if (isLoading && calls.length > 0) {
      const lastCall = calls[calls.length - 1];
      setCurrentStatus(getFriendlyStatus(lastCall.name, lastCall.type));
      setVisible(true);
    } else if (!isLoading && calls.length > 0) {
      // Show completion briefly
      setCurrentStatus({ icon: Check, text: "Ready", color: "text-green-400" });
      setTimeout(() => setVisible(false), 1500);
    }
  }, [calls.length, isLoading]);

  if (!visible || !currentStatus) return null;

  const Icon = currentStatus.icon;

  return (
    <div className="fixed bottom-20 left-4 z-[60]">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/90 border border-white/10 backdrop-blur-sm">
        <Icon size={14} className={currentStatus.color} />
        <span className="text-sm text-white/70">{currentStatus.text}</span>
        {isLoading && (
          <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
