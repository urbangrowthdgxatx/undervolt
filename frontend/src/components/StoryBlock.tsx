"use client";

import { X, Sparkles } from "lucide-react";
import type { StoryBlock } from "@/lib/chat-schema";

interface StoryBlockCardProps {
  block: StoryBlock;
  onRemove: (id: string) => void;
  isTheme?: boolean;
}

export function StoryBlockCard({ block, onRemove, isTheme }: StoryBlockCardProps) {
  return (
    <div className="group relative">
      {/* Card */}
      <div
        className={`relative border rounded-xl p-5 transition-all ${
          isTheme
            ? "bg-gradient-to-br from-white/10 to-white/5 border-white/30"
            : "bg-white/5 border-white/10 hover:border-white/20"
        }`}
      >
        {/* Theme indicator - only when explicitly passed as prop */}
        {isTheme && (
          <div className="absolute -top-2 left-4 bg-white text-black text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={10} />
            <span>Theme</span>
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={() => onRemove(block.id)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          title="Remove from story"
        >
          <X size={12} className="text-white/50" />
        </button>

        {/* Headline */}
        <h3 className="text-sm font-medium uppercase tracking-wider pr-8 text-white">
          {block.headline}
        </h3>

        {/* Insight */}
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          {block.insight.split("**").map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="text-white font-medium">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>

        {/* Data Point */}
        {block.dataPoint && (
          <div className="mt-4 bg-white/5 rounded-lg p-3 inline-block">
            <span className="text-2xl font-light text-white">
              {block.dataPoint.value}
            </span>
            <span className="text-xs text-white/40 ml-2">
              {block.dataPoint.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
