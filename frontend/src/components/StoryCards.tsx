"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import type { StoryBlock } from "@/lib/chat-schema";
import { InsightCard } from "./cards/InsightCard";
import { MapCard } from "./cards/MapCard";
import { ChartCard } from "./cards/ChartCard";

// A card can be an insight, a standalone map, or a standalone chart
export type StoryCardItem =
  | { type: "insight"; block: StoryBlock }
  | { type: "map"; id: string; title?: string; geoData: NonNullable<StoryBlock["geoData"]> }
  | { type: "chart"; id: string; chartData: NonNullable<StoryBlock["chartData"]> };

interface StoryCardsProps {
  cards: StoryCardItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  autoScrollToEnd?: boolean;
  isLoading?: boolean;
  suggestedQuestions?: string[];
  onQuestionClick?: (question: string) => void;
}

export function StoryCards({
  cards,
  selectedIds,
  onSelect,
  autoScrollToEnd = true,
  isLoading = false,
  suggestedQuestions = [],
  onQuestionClick,
}: StoryCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCardsLengthRef = useRef(cards.length);
  const [phantomExpanded, setPhantomExpanded] = useState(false);

  // Reset phantom state when cards change
  useEffect(() => {
    setPhantomExpanded(false);
  }, [cards.length]);

  // Auto-scroll to end when new cards are added or loading starts
  useEffect(() => {
    if (autoScrollToEnd && scrollRef.current) {
      if (cards.length > prevCardsLengthRef.current || isLoading) {
        scrollRef.current.scrollTo({
          left: scrollRef.current.scrollWidth,
          behavior: "smooth",
        });
      }
    }
    prevCardsLengthRef.current = cards.length;
  }, [cards.length, autoScrollToEnd, isLoading]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getCardId = (card: StoryCardItem): string => {
    switch (card.type) {
      case "insight":
        return card.block.id;
      case "map":
      case "chart":
        return card.id;
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-white/30">
        <p>Click a question to start building your story</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={20} />
      </button>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-12 scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {cards.map((card) => {
          const id = getCardId(card);
          const isSelected = selectedIds.has(id);

          switch (card.type) {
            case "insight":
              return (
                <div key={id} className="snap-start">
                  <InsightCard
                    block={card.block}
                    isSelected={isSelected}
                    onSelect={onSelect}
                  />
                </div>
              );
            case "map":
              return (
                <div key={id} className="snap-start">
                  <MapCard
                    id={id}
                    title={card.title}
                    geoData={card.geoData}
                    isSelected={isSelected}
                    onSelect={onSelect}
                  />
                </div>
              );
            case "chart":
              return (
                <div key={id} className="snap-start">
                  <ChartCard
                    id={id}
                    chartData={card.chartData}
                    isSelected={isSelected}
                    onSelect={onSelect}
                  />
                </div>
              );
          }
        })}

        {/* Loading skeleton card */}
        {isLoading && (
          <div className="snap-start flex-shrink-0 w-72 h-[480px] rounded-2xl border border-white/10 bg-white/5 flex flex-col overflow-hidden animate-pulse">
            <div className="p-5 pb-0">
              <div className="h-4 w-32 bg-white/10 rounded mb-3" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
            <div className="flex-1 p-5 pt-3 space-y-3">
              <div className="h-20 bg-white/5 rounded-xl" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-4/5 bg-white/10 rounded" />
                <div className="h-3 w-3/5 bg-white/10 rounded" />
              </div>
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="h-9 bg-white/5 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Phantom card - mystery card that reveals suggestions */}
        {!isLoading && suggestedQuestions.length > 0 && onQuestionClick && (
          <div
            className={`snap-start flex-shrink-0 w-72 h-[480px] rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${
              phantomExpanded
                ? "border-white/20 bg-gradient-to-b from-white/5 to-transparent"
                : "border-dashed border-white/20 bg-white/[0.02] hover:bg-white/5 hover:border-white/30"
            }`}
            onClick={() => !phantomExpanded && setPhantomExpanded(true)}
          >
            {!phantomExpanded ? (
              /* Collapsed state - mystery question mark */
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-4 group-hover:border-white/40 transition-colors">
                  <HelpCircle size={36} className="text-white/30" />
                </div>
                <p className="text-white/40 text-sm text-center mb-2">What's next?</p>
                <p className="text-white/20 text-xs text-center">Click to explore</p>
              </div>
            ) : (
              /* Expanded state - shows questions */
              <>
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400/70" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Continue the story</span>
                  </div>
                  <h3 className="text-sm font-medium text-white/70 mt-2">
                    What would you like to explore next?
                  </h3>
                </div>

                {/* Suggested questions */}
                <div className="flex-1 p-5 pt-0 space-y-2 overflow-y-auto">
                  {suggestedQuestions.slice(0, 5).map((question, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhantomExpanded(false);
                        onQuestionClick(question);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <p className="text-sm text-white/60 group-hover:text-white/80 line-clamp-2">
                        {question}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-white/30 group-hover:text-amber-400/70">
                        <span>Explore</span>
                        <ArrowRight size={10} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Footer hint */}
                <div className="p-4 border-t border-white/10">
                  <p className="text-xs text-white/30 text-center">
                    Or type your own question below
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  );
}
