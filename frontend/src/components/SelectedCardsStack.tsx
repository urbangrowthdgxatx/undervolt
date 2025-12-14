"use client";

import { useState } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import type { StoryCardItem } from "./StoryCards";
import type { StoryBlock } from "@/lib/chat-schema";

interface SelectedCardsStackProps {
  cards: StoryCardItem[];
  selectedIds: Set<string>;
  onDeselect: (id: string) => void;
}

export function SelectedCardsStack({ cards, selectedIds, onDeselect }: SelectedCardsStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get selected cards
  const selectedCards = cards.filter((card) => {
    const id = card.type === "insight" ? card.block.id : card.id;
    return selectedIds.has(id);
  });

  if (selectedCards.length === 0) return null;

  const getCardId = (card: StoryCardItem): string => {
    return card.type === "insight" ? card.block.id : card.id;
  };

  const getCardTitle = (card: StoryCardItem): string => {
    switch (card.type) {
      case "insight":
        return card.block.headline;
      case "map":
        return card.title || "Map";
      case "chart":
        return card.chartData.title || "Chart";
    }
  };

  const getCardPreview = (card: StoryCardItem): string => {
    switch (card.type) {
      case "insight":
        return card.block.insight.substring(0, 100) + (card.block.insight.length > 100 ? "..." : "");
      case "map":
        return `${card.geoData.districts?.length || 0} districts`;
      case "chart":
        return `${card.chartData.data.length} data points`;
    }
  };

  const getCardDataPoint = (card: StoryCardItem): { value: string; label: string } | null => {
    if (card.type === "insight" && card.block.dataPoint) {
      return card.block.dataPoint;
    }
    return null;
  };

  return (
    <div className="fixed bottom-32 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        <span>{selectedCards.length} selected</span>
        {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {/* Stack container */}
      {!isCollapsed && (
        <div className="relative">
          {/* Stacked cards */}
          {selectedCards.map((card, index) => {
            const id = getCardId(card);
            const isExpanded = expandedId === id;
            const stackOffset = index * 8; // Offset each card slightly
            const zIndex = isExpanded ? 50 : selectedCards.length - index;

            return (
              <div
                key={id}
                onClick={() => setExpandedId(isExpanded ? null : id)}
                className={`
                  transition-all duration-300 cursor-pointer
                  ${isExpanded ? "relative" : "absolute bottom-0 right-0"}
                `}
                style={{
                  transform: isExpanded
                    ? "none"
                    : `translateY(-${stackOffset}px) translateX(-${stackOffset}px)`,
                  zIndex,
                }}
              >
                <div
                  className={`
                    rounded-xl border bg-black/90 backdrop-blur-sm transition-all duration-300
                    ${isExpanded
                      ? "w-72 border-white/30 shadow-2xl"
                      : "w-56 border-white/20 hover:border-white/30"
                    }
                  `}
                >
                  {/* Card header - always visible */}
                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                        {card.type === "insight" ? "Insight" : card.type === "map" ? "Map" : "Chart"}
                      </p>
                      <h4 className="text-sm font-medium text-white truncate">{getCardTitle(card)}</h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeselect(id);
                      }}
                      className="p-1 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      {/* Data point if available */}
                      {getCardDataPoint(card) && (
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <span className="text-2xl font-light text-white">
                            {getCardDataPoint(card)!.value}
                          </span>
                          <p className="text-xs text-white/40 mt-1">
                            {getCardDataPoint(card)!.label}
                          </p>
                        </div>
                      )}

                      {/* Preview text */}
                      <p className="text-xs text-white/60 leading-relaxed">
                        {getCardPreview(card)}
                      </p>

                      {/* Type-specific info */}
                      {card.type === "insight" && card.block.whyStoryWorthy && (
                        <span className="inline-block text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full">
                          {card.block.whyStoryWorthy.replace(/-/g, " ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
