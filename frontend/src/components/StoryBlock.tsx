"use client";

import { X, Sparkles, Info } from "lucide-react";
import type { StoryBlock, StoryWorthyReason, Confidence } from "@/lib/chat-schema";
import { MiniMap } from "./MiniMap";
import { MiniChart } from "./MiniChart";
import { MiniImage } from "./MiniImage";

interface StoryBlockCardProps {
  block: StoryBlock;
  onRemove: (id: string) => void;
  isTheme?: boolean;
}

// Human-readable labels for why story-worthy
const WHY_LABELS: Record<StoryWorthyReason, string> = {
  'equity-gap': 'Equity gap',
  'post-freeze-shift': 'Post-freeze shift',
  'district-disparity': 'District disparity',
  'outlier': 'Outlier',
  'paradox': 'Paradox',
  'turning-point': 'Turning point',
};

// Confidence indicator colors
const CONFIDENCE_COLORS: Record<Confidence, string> = {
  'high': 'bg-green-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-red-500',
};

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

        {/* Headline + Confidence */}
        <div className="flex items-center gap-2 pr-8">
          <h3 className="text-sm font-medium uppercase tracking-wider text-white">
            {block.headline}
          </h3>
          {block.confidence && (
            <div
              className={`w-2 h-2 rounded-full ${CONFIDENCE_COLORS[block.confidence]}`}
              title={`Confidence: ${block.confidence}`}
            />
          )}
        </div>

        {/* Why Story-Worthy Chip */}
        {block.whyStoryWorthy && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">
              {WHY_LABELS[block.whyStoryWorthy]}
            </span>
          </div>
        )}

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

        {/* Evidence Section */}
        {block.evidence && block.evidence.length > 0 && (
          <div className="mt-3 space-y-1">
            {block.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  {ev.stat.split("**").map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="text-white/70 font-medium">{part}</strong>
                    ) : (
                      part
                    )
                  )}
                  <span className="text-white/30 ml-1">· {ev.source}</span>
                </span>
              </div>
            ))}
          </div>
        )}

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

        {/* Mini Map */}
        {block.geoData && (
          <div className="mt-4">
            <MiniMap geoData={block.geoData} />
          </div>
        )}

        {/* Mini Chart */}
        {block.chartData && (
          <div className="mt-4">
            <MiniChart chartData={block.chartData} />
          </div>
        )}

        {/* Mini Image */}
        {block.imageData && (
          <div className="mt-4">
            <MiniImage imageData={block.imageData} />
          </div>
        )}
      </div>
    </div>
  );
}
