"use client";

import { Info, Check } from "lucide-react";
import type { StoryBlock, StoryWorthyReason, Confidence } from "@/lib/chat-schema";

interface InsightCardProps {
  block: StoryBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Simple markdown parser for **bold** and *italic*
function parseMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold first (**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for italic (*)
    const italicMatch = remaining.match(/\*(.+?)\*/);

    // Find which comes first
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    // No more matches
    if (boldIndex === -1 && italicIndex === -1) {
      if (remaining) elements.push(remaining);
      break;
    }

    // Determine which match to use (whichever comes first)
    const useBold = boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex);
    const match = useBold ? boldMatch! : italicMatch!;
    const index = useBold ? boldIndex : italicIndex;

    // Add text before the match
    if (index > 0) {
      elements.push(remaining.slice(0, index));
    }

    // Add the formatted element
    if (useBold) {
      elements.push(
        <strong key={key++} className="text-white font-medium">
          {match[1]}
        </strong>
      );
    } else {
      elements.push(
        <em key={key++} className="text-white/80 italic">
          {match[1]}
        </em>
      );
    }

    // Move past the match
    remaining = remaining.slice(index + match[0].length);
  }

  return elements;
}

const WHY_LABELS: Record<StoryWorthyReason, string> = {
  'equity-gap': 'Equity gap',
  'post-freeze-shift': 'Post-freeze shift',
  'district-disparity': 'District disparity',
  'outlier': 'Outlier',
  'paradox': 'Paradox',
  'turning-point': 'Turning point',
};

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  'high': 'bg-green-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-red-500',
};

export function InsightCard({ block, isSelected, onSelect }: InsightCardProps) {
  return (
    <div
      className={`
        flex-shrink-0 w-72 h-[480px] rounded-2xl border transition-all
        flex flex-col overflow-hidden
        ${isSelected
          ? "border-white/40 bg-white/10 ring-2 ring-white/20"
          : "border-white/10 bg-white/5 hover:border-white/20"
        }
      `}
    >
      {/* Header */}
      <div className="p-5 pb-0">
        {/* Headline + Confidence */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-white flex-1">
            {block.headline}
          </h3>
          {block.confidence && (
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${CONFIDENCE_COLORS[block.confidence]}`}
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
      </div>

      {/* Body - scrollable */}
      <div className="flex-1 overflow-y-auto p-5 pt-3">
        {/* Data Point - prominent */}
        {block.dataPoint && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
            <span className="text-3xl font-light text-white">
              {block.dataPoint.value}
            </span>
            <p className="text-xs text-white/40 mt-1">
              {block.dataPoint.label}
            </p>
          </div>
        )}

        {/* Insight */}
        <p className="text-sm text-white/70 leading-relaxed">
          {parseMarkdown(block.insight)}
        </p>

        {/* Evidence Section */}
        {block.evidence && block.evidence.length > 0 && (
          <div className="mt-4 space-y-2">
            {block.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  {parseMarkdown(ev.stat)}
                  <span className="text-white/30 ml-1">· {ev.source}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Selection */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => onSelect(block.id)}
          className={`
            w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all
            ${isSelected
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          {isSelected ? (
            <>
              <Check size={14} />
              <span className="text-sm">Selected</span>
            </>
          ) : (
            <span className="text-sm">Select</span>
          )}
        </button>
      </div>
    </div>
  );
}
