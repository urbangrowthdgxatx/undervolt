"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

export function StoryCards({
  cards,
  selectedIds,
  onSelect,
  autoScrollToEnd = true,
  isLoading = false,
}: StoryCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCardsLengthRef = useRef(cards.length);

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
          <div className="snap-start flex-shrink-0 w-72 h-[400px] rounded-2xl border border-white/10 bg-white/5 flex flex-col overflow-hidden animate-pulse">
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
      </div>

      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  );
}
