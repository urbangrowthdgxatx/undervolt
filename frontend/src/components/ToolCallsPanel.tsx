"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Database, Terminal } from "lucide-react";

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
}

export function ToolCallsPanel({ calls, isLoading }: ToolCallsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (calls.length === 0 && !isLoading) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-md">
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
        <div className="mt-2 rounded-xl bg-black/95 border border-white/20 backdrop-blur-sm overflow-hidden max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Terminal size={14} className="text-white/50" />
            <span className="text-xs text-white/50 uppercase tracking-wider">Tool Calls</span>
          </div>

          <div className="p-2 space-y-2">
            {calls.map((call, i) => (
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
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      call.type === "call"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {call.type}
                  </span>
                  <span className="text-white/70 font-mono">{call.name}</span>
                </div>

                {call.type === "call" && call.input && (
                  <pre className="text-white/50 overflow-x-auto whitespace-pre-wrap text-[10px] mt-1 p-1.5 bg-black/30 rounded">
                    {typeof call.input === "string"
                      ? call.input
                      : JSON.stringify(call.input, null, 2)}
                  </pre>
                )}

                {call.type === "result" && call.result && (
                  <pre className="text-white/50 overflow-x-auto whitespace-pre-wrap text-[10px] mt-1 p-1.5 bg-black/30 rounded max-h-32 overflow-y-auto">
                    {typeof call.result === "string"
                      ? call.result.substring(0, 500) + (call.result.length > 500 ? "..." : "")
                      : JSON.stringify(call.result, null, 2).substring(0, 500)}
                  </pre>
                )}
              </div>
            ))}

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
