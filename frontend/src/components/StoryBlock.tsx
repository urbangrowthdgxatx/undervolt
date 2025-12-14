"use client";

import { X, Link2, Sparkles } from "lucide-react";
import type { StoryBlock } from "@/lib/chat-schema";

interface StoryBlockCardProps {
  block: StoryBlock;
  onRemove: (id: string) => void;
  connectedBlocks?: StoryBlock[];
  isTheme?: boolean;
}

export function StoryBlockCard({ block, onRemove, connectedBlocks, isTheme }: StoryBlockCardProps) {
  const hasConnections = connectedBlocks && connectedBlocks.length > 0;

  return (
    <div className="group relative">
      {/* Connection indicator */}
      {hasConnections && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Link2 size={12} />
            <span>connects to</span>
          </div>
          <div className="flex gap-1">
            {connectedBlocks.map((cb) => (
              <span
                key={cb.id}
                className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60"
              >
                {cb.headline}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connection reason */}
      {block.connectionReason && (
        <div className="mb-3 ml-4 pl-4 border-l-2 border-white/20">
          <p className="text-xs text-white/40 italic">{block.connectionReason}</p>
        </div>
      )}

      {/* Card */}
      <div
        className={`relative border rounded-xl p-5 transition-all ${
          isTheme || block.isTheme
            ? "bg-gradient-to-br from-white/10 to-white/5 border-white/30"
            : "bg-white/5 border-white/10 hover:border-white/20"
        }`}
      >
        {/* Theme indicator */}
        {(isTheme || block.isTheme) && (
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
        <h3
          className={`text-sm font-medium uppercase tracking-wider pr-8 ${
            isTheme || block.isTheme ? "text-white" : "text-white"
          }`}
        >
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

        {/* Connection dots */}
        {hasConnections && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20 border-2 border-white/40" />
        )}
      </div>
    </div>
  );
}
