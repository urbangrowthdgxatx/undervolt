"use client";

import { useState } from "react";
import { X, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { StoryBlock } from "@/lib/chat-schema";

interface SynthesizedInsightViewProps {
  insight: StoryBlock;
  sources: StoryBlock[];
  onAccept: () => void;
  onDiscard: () => void;
}

export function SynthesizedInsightView({
  insight,
  sources,
  onAccept,
  onDiscard,
}: SynthesizedInsightViewProps) {
  const [showSources, setShowSources] = useState(true);

  return (
    <div className="fixed bottom-32 right-6 z-50 flex flex-col items-end gap-3 max-w-sm">
      {/* Main synthesized insight card */}
      <div className="w-80 rounded-2xl border border-amber-500/30 bg-black/95 backdrop-blur-sm shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs text-amber-400/80 uppercase tracking-wider font-medium">
              Generated Insight
            </span>
          </div>
          <h3 className="text-base font-medium text-white">{insight.headline}</h3>
        </div>

        {/* Data point */}
        {insight.dataPoint && (
          <div className="px-4 py-3 bg-white/5">
            <div className="text-center">
              <span className="text-2xl font-light text-white">
                {insight.dataPoint.value}
              </span>
              <p className="text-xs text-white/40 mt-1">{insight.dataPoint.label}</p>
            </div>
          </div>
        )}

        {/* Insight text */}
        <div className="p-4 pt-3">
          <p className="text-sm text-white/70 leading-relaxed">{insight.insight}</p>
        </div>

        {/* Sources toggle */}
        <button
          onClick={() => setShowSources(!showSources)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-white/40 hover:text-white/60 border-t border-white/10 transition-colors"
        >
          <span>Based on {sources.length} insights</span>
          {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Action buttons */}
        <div className="p-3 flex gap-2 border-t border-white/10">
          <button
            onClick={onDiscard}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <X size={14} />
            Discard
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium"
          >
            <Check size={14} />
            Keep
          </button>
        </div>
      </div>

      {/* Stacked source cards */}
      {showSources && (
        <div className="relative w-72">
          {sources.map((source, index) => {
            const stackOffset = index * 12;
            const opacity = 1 - index * 0.15;

            return (
              <div
                key={source.id}
                className="absolute bottom-0 right-0 w-full transition-all duration-300"
                style={{
                  transform: `translateY(-${stackOffset}px)`,
                  zIndex: sources.length - index,
                  opacity: Math.max(opacity, 0.4),
                }}
              >
                <div className="rounded-xl border border-white/20 bg-black/90 backdrop-blur-sm p-3">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Source</p>
                  <h4 className="text-sm font-medium text-white truncate">{source.headline}</h4>
                  {source.dataPoint && (
                    <p className="text-xs text-white/50 mt-1">
                      {source.dataPoint.value} · {source.dataPoint.label}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {/* Spacer to account for stacked cards height */}
          <div style={{ height: `${(sources.length - 1) * 12 + 80}px` }} />
        </div>
      )}
    </div>
  );
}
