"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowLeft, RefreshCw, Send, PlayCircle } from "lucide-react";
import { FloatingQuestions } from "@/components/FloatingQuestions";
import { StorylineCards, STORYLINES, type Storyline } from "@/components/StorylineCards";
import { StoryCards, type StoryCardItem } from "@/components/StoryCards";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import type { ChatResponse, StoryBlock } from "@/lib/chat-schema";

export default function ExplorationPage() {
  // Onboarding state - check localStorage on mount
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem("undervolt-onboarding-complete");
    setHasCompletedOnboarding(completed === "true");
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem("undervolt-onboarding-complete", "true");
    setHasCompletedOnboarding(true);
  };

  // Replay intro
  const handleReplayIntro = () => {
    localStorage.removeItem("undervolt-onboarding-complete");
    setHasCompletedOnboarding(false);
  };

  // Storyline state - null means on homepage
  const [activeStoryline, setActiveStoryline] = useState<Storyline | null>(null);

  // Questions state - seeded from storyline
  const [questions, setQuestions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Story cards state
  const [cards, setCards] = useState<StoryCardItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Custom question input (for story mode)
  const [customQuestion, setCustomQuestion] = useState("");

  // Derived state
  const hasStartedExploring = cards.length > 0;

  // Handle storyline selection
  const handleSelectStoryline = (storyline: Storyline) => {
    setActiveStoryline(storyline);
    setQuestions(storyline.questions);
    setCards([]);
    setSelectedIds(new Set());
  };

  // Go back to storyline selection
  const handleBackToStorylines = () => {
    setActiveStoryline(null);
    setCards([]);
    setQuestions([]);
    setSelectedIds(new Set());
  };

  // Get all blocks from cards
  const getAllBlocks = (): StoryBlock[] => {
    return cards
      .filter((card): card is { type: "insight"; block: StoryBlock } => card.type === "insight")
      .map((card) => card.block);
  };

  // Fetch questions based on storyline and existing story
  const fetchQuestions = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/story/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: getAllBlocks(),
          storyline: activeStoryline?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || activeStoryline?.questions || []);
      }
    } catch {
      setQuestions(activeStoryline?.questions || []);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch new questions when story grows (only if in a storyline)
  useEffect(() => {
    if (activeStoryline && cards.length > 1) {
      fetchQuestions();
    }
  }, [cards.length]);

  // Handle question click - use fallback for now (API can be re-enabled later)
  const handleQuestionClick = async (question: string) => {
    setIsLoading(true);

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 800));

    // Use fallback directly for reliable behavior
    useFallback(question);

    setIsLoading(false);
  };

  // Handle LLM response - convert to cards
  const handleResponse = (response: ChatResponse) => {
    console.log("handleResponse called:", response);
    if (response.storyBlock) {
      const block = response.storyBlock;
      const newCards: StoryCardItem[] = [];

      // Always add insight card
      newCards.push({ type: "insight", block });

      // Add map card if geoData exists
      if (block.geoData) {
        newCards.push({
          type: "map",
          id: `${block.id}-map`,
          title: block.headline,
          geoData: block.geoData,
        });
      }

      // Add chart card if chartData exists
      if (block.chartData) {
        newCards.push({
          type: "chart",
          id: `${block.id}-chart`,
          chartData: block.chartData,
        });
      }

      console.log("Adding cards:", newCards);
      setCards((prev) => [...prev, ...newCards]);
    }
  };

  // Fallback responses
  const useFallback = (question: string) => {
    const lower = question.toLowerCase();

    if (lower.includes("growth") || lower.includes("fastest") || lower.includes("booming")) {
      handleResponse({
        message: "Austin's growth is concentrated in the outer ZIPs...",
        storyBlock: {
          id: `growth-${Date.now()}`,
          headline: "The Sprawl Signal",
          insight:
            "**78660** (Pflugerville) leads with **8,234** new construction permits. Central Austin sees remodels; the edges see new builds.",
          dataPoint: { label: "new permits in 78660", value: "8,234" },
          whyStoryWorthy: "district-disparity",
          evidence: [
            { stat: "78660: 8,234 new construction vs 78704: 1,203", source: "2019-2024 permit data" },
          ],
          confidence: "high",
          chartData: {
            type: "bar",
            title: "Permits by ZIP",
            data: [
              { name: "78660", value: 8234 },
              { name: "78704", value: 1203 },
              { name: "78745", value: 2456 },
              { name: "78748", value: 1890 },
            ],
          },
        },
      });
    } else if (lower.includes("generator") || lower.includes("backup") || lower.includes("power")) {
      handleResponse({
        message: "Generator permits reveal a resilience divide...",
        storyBlock: {
          id: `generators-${Date.now()}`,
          headline: "Resilience is Wealth",
          insight:
            "**District 10 (Westlake)** has **3x more generators** per capita than East Austin. The freeze revealed who can afford to stay powered.",
          dataPoint: { label: "generators in District 10", value: "2,151" },
          whyStoryWorthy: "equity-gap",
          evidence: [
            { stat: "District 10: 2,151 vs District 4: 412 generators", source: "2021-2024 permit data" },
          ],
          confidence: "high",
          geoData: {
            type: "district",
            districts: [10, 4],
            signal: "generator",
          },
        },
      });
    } else {
      handleResponse({
        message: "Let me explore that...",
        storyBlock: {
          id: `explore-${Date.now()}`,
          headline: "Data Point Found",
          insight:
            "Exploring the permits reveals patterns. **1.2 million** records tell the story of Austin's transformation.",
          dataPoint: { label: "total permits", value: "1.2M" },
          whyStoryWorthy: "turning-point",
          evidence: [{ stat: "1.2 million permits from 2010-2024", source: "Austin Open Data" }],
          confidence: "high",
        },
      });
    }
  };

  // Toggle card selection
  const handleSelectCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Synthesize selected cards into a theme
  const synthesizeTheme = async () => {
    const selectedBlocks = cards
      .filter(
        (card): card is { type: "insight"; block: StoryBlock } =>
          card.type === "insight" && selectedIds.has(card.block.id)
      )
      .map((card) => card.block);

    if (selectedBlocks.length < 2) return;

    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/story/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: selectedBlocks }),
      });

      if (res.ok) {
        const theme = await res.json();
        // Remove selected cards and add theme card
        setCards((prev) => {
          const newCards = prev.filter((card) => {
            const cardId = card.type === "insight" ? card.block.id : card.id;
            return !selectedIds.has(cardId);
          });
          newCards.push({ type: "insight", block: { ...theme, isTheme: true } });
          return newCards;
        });
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.warn("Synthesis failed:", error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Handle custom question submit
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuestion.trim()) {
      handleQuestionClick(customQuestion.trim());
      setCustomQuestion("");
    }
  };

  // Show loading state while checking localStorage
  if (hasCompletedOnboarding === null) {
    return <div className="min-h-screen bg-black" />;
  }

  // Show onboarding wizard if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-black text-white story-bg">
      {/* Floating header */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 pointer-events-auto">
            {activeStoryline && (
              <button
                onClick={handleBackToStorylines}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Stories</span>
              </button>
            )}
            <h1 className="text-lg font-light tracking-widest text-white/40 hover:text-white/70 transition-colors cursor-default">
              UNDERVOLT
            </h1>
          </div>
          {/* Replay intro button - only on storyline selection */}
          {!activeStoryline && (
            <button
              onClick={handleReplayIntro}
              className="pointer-events-auto flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors"
            >
              <PlayCircle size={14} />
              <span>Replay Intro</span>
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-12">
        {!activeStoryline ? (
          /* Homepage - storyline selection */
          <section className="max-w-5xl mx-auto px-6 py-16">
            <StorylineCards onSelectStoryline={handleSelectStoryline} isLoading={isLoading} />
          </section>
        ) : !hasStartedExploring ? (
          /* Exploration mode - full floating questions */
          <section className="min-h-[calc(100vh-6rem)]">
            <FloatingQuestions
              questions={questions}
              onQuestionClick={handleQuestionClick}
              onRefresh={fetchQuestions}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              storylineTitle={activeStoryline.title}
            />
          </section>
        ) : (
          /* Story mode - collapsed questions + cards */
          <section className="min-h-[calc(100vh-6rem)] flex flex-col">
            {/* Collapsed questions at top */}
            <div className="pt-2">
              <FloatingQuestions
                questions={questions}
                onQuestionClick={handleQuestionClick}
                onRefresh={fetchQuestions}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                collapsed
              />
            </div>

            {/* Story cards in center */}
            <div className="flex-1 flex items-center py-8">
              <div className="w-full">
                <StoryCards
                  cards={cards}
                  selectedIds={selectedIds}
                  onSelect={handleSelectCard}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Bottom bar - title, input, find theme */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/50 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto flex items-center gap-6">
                {/* Title - left */}
                <div className="flex-shrink-0">
                  <p className="text-white/30 text-xs uppercase tracking-widest">Investigating</p>
                  <h2 className="text-lg font-light text-white">{activeStoryline.title}</h2>
                </div>

                {/* Input - center */}
                <form onSubmit={handleCustomSubmit} className="flex-1 max-w-lg">
                  <div className="relative">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Ask anything about Austin permits..."
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 rounded-full bg-white/5 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !customQuestion.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>

                {/* Refresh */}
                <button
                  onClick={fetchQuestions}
                  disabled={isRefreshing}
                  className="p-2 text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                  title="New questions"
                >
                  <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                </button>

                {/* Find Theme button - right */}
                {selectedIds.size >= 2 && (
                  <button
                    onClick={synthesizeTheme}
                    disabled={isSynthesizing}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Find Theme ({selectedIds.size})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </section>
        )}
      </main>
    </div>
  );
}
