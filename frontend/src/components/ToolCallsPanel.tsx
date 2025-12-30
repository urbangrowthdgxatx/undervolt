"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Database, Terminal, Trash2 } from "lucide-react";

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

// Extract SQL from tool call input
function extractSQL(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "string") return input;
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    // Common field names for SQL - check all possibilities
    const sqlFields = ['sql', 'query', 'statement', 'text', 'command', 'q'];
    for (const field of sqlFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return String(obj[field]);
      }
    }
    // If it's a simple object, just stringify it nicely
    return JSON.stringify(obj, null, 2);
  }
  return null;
}

export function ToolCallsPanel({ calls, isLoading, onClear }: ToolCallsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new calls come in
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [calls.length, isExpanded]);

  // Always show the panel (user can collapse it)
  return (
    <div className="fixed bottom-20 left-4 z-[60] w-[500px]">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-xs"
      >
        <Database size={12} />
        <span>
          {isLoading ? "Querying..." : `${calls.length} queries`}
        </span>
        {isLoading && (
          <div className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
        )}
        {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="mt-2 rounded-xl bg-black/95 border border-white/20 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-white/50" />
              <span className="text-xs text-white/50 uppercase tracking-wider">SQL Queries</span>
            </div>
            {onClear && calls.length > 0 && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <Trash2 size={10} />
                Clear
              </button>
            )}
          </div>

          {/* Calls list */}
          <div ref={scrollRef} className="p-2 space-y-2 max-h-96 overflow-y-auto">
            {calls.map((call, i) => {
              const sql = call.type === "call" ? extractSQL(call.input) : null;

              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-xs ${
                    call.type === "call"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-green-500/10 border border-green-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
                        call.type === "call"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {call.type === "call" ? "SQL" : "Result"}
                    </span>
                    <span className="text-white/50 font-mono text-[10px]">{call.name}</span>
                  </div>

                  {/* SQL Query - show prominently */}
                  {call.type === "call" && sql && (
                    <pre className="text-blue-300/80 overflow-x-auto whitespace-pre-wrap text-[11px] mt-1 p-2 bg-black/50 rounded font-mono leading-relaxed">
                      {sql}
                    </pre>
                  )}

                  {/* Non-SQL input */}
                  {call.type === "call" && !sql && call.input && (
                    <pre className="text-white/50 overflow-x-auto whitespace-pre-wrap text-[10px] mt-1 p-1.5 bg-black/30 rounded">
                      {JSON.stringify(call.input, null, 2)}
                    </pre>
                  )}

                  {/* Result */}
                  {call.type === "result" && call.result && (
                    <pre className="text-green-300/70 overflow-x-auto whitespace-pre-wrap text-[10px] mt-1 p-2 bg-black/50 rounded max-h-40 overflow-y-auto font-mono">
                      {typeof call.result === "string"
                        ? call.result.substring(0, 1000) + (call.result.length > 1000 ? "\n..." : "")
                        : JSON.stringify(call.result, null, 2).substring(0, 1000)}
                    </pre>
                  )}
                </div>
              );
            })}

            {calls.length === 0 && isLoading && (
              <div className="text-center py-4 text-white/30 text-xs">
                Waiting for queries...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
