"use client";
import { Suspense } from "react";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles, ArrowLeft, RefreshCw, Send, PlayCircle, Lock } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { FloatingQuestions } from "@/components/FloatingQuestions";
import { StorylineCards, STORYLINES, type Storyline } from "@/components/StorylineCards";
import { StoryCards, type StoryCardItem } from "@/components/StoryCards";
import { SelectedCardsStack } from "@/components/SelectedCardsStack";
import { SynthesizedInsightView } from "@/components/SynthesizedInsightView";
import { ToolCallsPanel, type ToolCall } from "@/components/ToolCallsPanel";
import type { ChatResponse, StoryBlock } from "@/lib/chat-schema";

function ExplorationPageContent() {

  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q") || "";

  // Storyline state - null means on homepage
  const [activeStoryline, setActiveStoryline] = useState<Storyline | null>(null);

  // Questions state - seeded from storyline
  const [questions, setQuestions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Tool calls for debug panel
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  // Story cards state
  const [cards, setCards] = useState<StoryCardItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Synthesized insight with source cards
  const [synthesizedInsight, setSynthesizedInsight] = useState<{
    insight: StoryBlock;
    sources: StoryBlock[];
  } | null>(null);

  // Track asked questions so phantom card doesn't re-show them
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  // Custom question input (for story mode)
  const [customQuestion, setCustomQuestion] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user is signed up
  useEffect(() => {
    try {
      setUserEmail(localStorage.getItem("undervolt_email"));
    } catch {}
  }, []);

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

  // Handle question click - call API with timeout, fallback if slow
  const handleQuestionClick = async (question: string) => {
    trackEvent("ai_query");
    setAskedQuestions((prev) => new Set(prev).add(question));
    setIsLoading(true);
    // Don't clear tool calls - keep history

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // Get existing insight blocks for context
    const existingBlocks = cards
      .filter((c): c is { type: "insight"; block: StoryBlock } => c.type === "insight")
      .map((c) => ({ headline: c.block.headline, insight: c.block.insight }));

    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('undervolt_email') : null;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, mode: "scout", existingBlocks, email: userEmail }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let gotResponse = false;

      // Read with timeout
      const readTimeout = 45000; // 45s to read full response
      const readStart = Date.now();

      while (true) {
        if (Date.now() - readStart > readTimeout) {
          console.log("Read timeout, using fallback");
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events (split by double newline)
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          const lines = eventBlock.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (eventType === "response" && eventData) {
            try {
              const parsed = JSON.parse(eventData) as ChatResponse;
              console.log("API response:", parsed);
              handleResponse(parsed, question);
              gotResponse = true;
            } catch (e) {
              console.error("Failed to parse response:", e);
            }
          }

          // Capture tool calls for debug panel
          if (eventType === "tool-call" && eventData) {
            try {
              const data = JSON.parse(eventData);
              setToolCalls((prev) => [
                ...prev,
                { type: "call", name: data.name, input: data.input, timestamp: Date.now() },
              ]);
            } catch (e) {
              console.error("Failed to parse tool-call:", e);
            }
          }

          if (eventType === "tool-result" && eventData) {
            try {
              const data = JSON.parse(eventData);
              setToolCalls((prev) => [
                ...prev,
                { type: "result", name: data.name, result: data.result, timestamp: Date.now() },
              ]);
            } catch (e) {
              console.error("Failed to parse tool-result:", e);
            }
          }

          // Break when done event received
          if (eventType === "done") {
            console.log("Received done event");
            break;
          }
        }

        // If we processed a done event, break outer loop too
        if (events.some(e => e.includes("event: done"))) {
          break;
        }
      }

      // Fallback if no response from API
      if (!gotResponse) {
        console.log("No API response, using fallback");
        useFallback(question);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request timed out, using fallback");
      } else {
        console.error("API error:", error);
      }
      useFallback(question);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a story block looks like an error/failure message
  const isErrorBlock = (block: StoryBlock): boolean => {
    const errorPatterns = [
      /failed/i, /error/i, /missing/i, /couldn't/i, /can't/i, /cannot/i,
      /not present/i, /not available/i, /no data/i, /query failed/i,
      /doesn't exist/i, /does not exist/i, /unable to/i, /problem/i,
    ];
    const textToCheck = `${block.headline} ${block.insight}`;
    return errorPatterns.some(pattern => pattern.test(textToCheck));
  };

  // Check if we already have a card with this ID or similar headline
  const isDuplicateCard = (block: StoryBlock): boolean => {
    const existingIds = cards
      .filter((c): c is { type: "insight"; block: StoryBlock } => c.type === "insight")
      .map((c) => c.block.id);

    const existingHeadlines = cards
      .filter((c): c is { type: "insight"; block: StoryBlock } => c.type === "insight")
      .map((c) => c.block.headline.toLowerCase());

    // Check exact ID match
    if (existingIds.includes(block.id)) return true;

    // Check similar headline (exact match or very similar)
    if (existingHeadlines.includes(block.headline.toLowerCase())) return true;

    return false;
  };

  // Auto-submit question from URL param (?q=...)
  // Must also auto-select a storyline, otherwise the UI stays on the storyline picker
  useEffect(() => {
    if (initialQuestion && !hasStartedExploring && !isLoading && !activeStoryline) {
      // Try to match the question to a storyline by keyword overlap
      const q = initialQuestion.toLowerCase();
      const matched = STORYLINES.find((s) =>
        s.questions.some((sq) => q.includes(sq.toLowerCase().slice(0, 20)))
      ) || (
        q.includes("solar") || q.includes("battery") ? STORYLINES.find(s => s.id === "solar") :
        q.includes("generator") || q.includes("grid") || q.includes("resilience") || q.includes("freeze") || q.includes("uri") ? STORYLINES.find(s => s.id === "resilience") :
        STORYLINES[0]
      );
      if (matched) {
        handleSelectStoryline(matched);
      }
      handleQuestionClick(initialQuestion);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  // Handle LLM response - convert to cards
  const handleResponse = (response: ChatResponse, question?: string) => {
    console.log("handleResponse called:", response);
    let block = response.storyBlock;
    let isGeneratedFromMessage = false;

    // If no storyBlock, create one from the message
    if (!block && response.message) {
      // Extract first sentence for headline
      const firstSentence = response.message.split(/[.!?]/)[0].trim();
      const headline = firstSentence.length > 50
        ? firstSentence.substring(0, 47) + "..."
        : firstSentence || "Response";

      block = {
        id: `response-${Date.now()}`,
        headline,
        insight: response.message,
        whyStoryWorthy: "turning-point",
        confidence: "medium",
      };
      isGeneratedFromMessage = true;
    }

    // Inject question text into the block (from API _question field or caller)
    if (block) {
      const q = (response as any)._question || question;
      if (q) block.question = q;
    }

    if (!block) {
      console.warn("No storyBlock or message in response");
      return;
    }

    // Only filter error blocks from model-generated storyBlocks, not from messages
    // (We want to show the user what the model said even if it mentions errors)
    if (!isGeneratedFromMessage && isErrorBlock(block)) {
      console.warn("Skipping error-like storyBlock:", block.headline);
      return;
    }

    // Filter out duplicates
    if (isDuplicateCard(block)) {
      console.warn("Skipping duplicate storyBlock:", block.headline);
      return;
    }

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
  };

  const useFallback = (question: string) => {
    // Show error card instead of fake data
    handleResponse({
      message: "This question doesn't have a cached answer yet. Try one of the suggested questions above.",
      storyBlock: {
        id: `unavailable-${Date.now()}`,
        headline: "Answer Unavailable",
        insight: "This question hasn't been pre-analyzed yet. Select one of the suggested questions to explore real Austin permit data powered by NVIDIA Nemotron.",
        whyStoryWorthy: "turning-point",
        confidence: "low" as const,
      },
    }, question);
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

  // Synthesize selected cards into an insight
  const synthesizeInsight = async () => {
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
        const newInsight = await res.json();
        // Store the synthesized insight with its sources
        setSynthesizedInsight({
          insight: { ...newInsight, id: `synthesis-${Date.now()}` },
          sources: selectedBlocks,
        });
        // Clear selection
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.warn("Synthesis failed:", error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Clear synthesized insight and add it to main cards
  const acceptSynthesizedInsight = () => {
    if (synthesizedInsight) {
      setCards((prev) => [
        ...prev,
        { type: "insight", block: synthesizedInsight.insight },
      ]);
      setSynthesizedInsight(null);
    }
  };

  // Discard synthesized insight
  const discardSynthesizedInsight = () => {
    setSynthesizedInsight(null);
  };

  // Handle custom question submit
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    
    // Require signup for custom queries
    if (!userEmail) {
      setShowSignupModal(true);
      return;
    }
    
    handleQuestionClick(customQuestion.trim());
    setCustomQuestion("");
  };
  
  const handleSignup = (email: string) => {
    try { localStorage.setItem("undervolt_email", email); } catch {}
    setUserEmail(email);
    setShowSignupModal(false);
    if (customQuestion.trim()) {
      handleQuestionClick(customQuestion.trim());
      setCustomQuestion("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white story-bg flex flex-col">
      {/* Tool calls debug panel */}
      <ToolCallsPanel
        calls={toolCalls}
        isLoading={isLoading}
        onClear={() => setToolCalls([])}
      />

      {/* Context bar below nav */}
      {activeStoryline && (
        <div className="fixed top-[57px] left-0 right-0 z-40 bg-black/60 backdrop-blur-sm border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
            <button
              onClick={handleBackToStorylines}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span className="text-sm">All Stories</span>
            </button>
            <span className="text-sm text-white/30">{activeStoryline.title}</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={activeStoryline ? "pt-28 pb-24 flex-1" : "pt-16 pb-24 flex-1"}>
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
              userEmail={userEmail}
              onSignupClick={() => setShowSignupModal(true)}
            />
          </section>
        ) : (
          /* Story mode - cards + bottom bar */
          <section className="min-h-[calc(100vh-6rem)] flex flex-col">
            {/* Story cards in center - with phantom card for suggestions */}
            <div className="flex-1 flex items-center py-8">
              <div className="w-full">
                <StoryCards
                  cards={cards}
                  selectedIds={selectedIds}
                  onSelect={handleSelectCard}
                  isLoading={isLoading}
                  suggestedQuestions={questions.filter((q) => !askedQuestions.has(q))}
                  onQuestionClick={handleQuestionClick}
                />
              </div>
            </div>

            {/* Synthesized insight view - shows when insight is generated */}
            {synthesizedInsight && (
              <SynthesizedInsightView
                insight={synthesizedInsight.insight}
                sources={synthesizedInsight.sources}
                onAccept={acceptSynthesizedInsight}
                onDiscard={discardSynthesizedInsight}
              />
            )}

            {/* Selected cards stack - only show when selecting, not when synthesized */}
            {!synthesizedInsight && selectedIds.size > 0 && (
              <SelectedCardsStack
                cards={cards}
                selectedIds={selectedIds}
                onDeselect={handleSelectCard}
              />
            )}

            {/* Bottom bar - title, input, question chips, find theme */}
            <div className="relative z-50 px-6 py-4 border-t border-white/10 bg-black/50 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto">
                {/* Main row */}
                <div className="flex items-center gap-4">
                  {/* Title - left */}
                  <div className="flex-shrink-0">
                    <p className="text-white/30 text-xs uppercase tracking-widest">Investigating</p>
                    <h2 className="text-lg font-light text-white">{activeStoryline.title}</h2>
                  </div>

                  {/* Input */}
                  <form onSubmit={handleCustomSubmit} className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder={userEmail ? "Ask anything..." : "Sign up to ask custom questions..."}
                        disabled={isLoading}
                        className={`w-full px-4 py-2.5 pr-10 rounded-full border text-white text-sm focus:outline-none transition-all disabled:opacity-50 ${
                          userEmail
                            ? "bg-white/5 border-white/20 placeholder-white/30 focus:border-white/40 focus:bg-white/10"
                            : "bg-white/[0.02] border-white/10 placeholder-white/20 cursor-pointer"
                        }`}
                        onClick={() => !userEmail && setShowSignupModal(true)}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !customQuestion.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        {userEmail ? <Send size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </form>

                  {/* Quick question chips */}
                  <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    {questions.slice(0, 2).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuestionClick(q)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-50 max-w-[180px] truncate"
                      >
                        {q}
                      </button>
                    ))}
                    <button
                      onClick={fetchQuestions}
                      disabled={isRefreshing}
                      className="p-1.5 text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                      title="New questions"
                    >
                      <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                  </div>

                  {/* Generate Insight button - right */}
                  {selectedIds.size >= 2 && (
                    <button
                      onClick={synthesizeInsight}
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
                          Find Insight ({selectedIds.size})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setShowSignupModal(false)}>
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Join the Waitlist</h3>
              <p className="text-white/50 text-sm">
                Get early access to custom AI queries
              </p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const email = (e.target as HTMLFormElement).email.value;
              if (email) {
                try {
                  const { createClient } = await import("@supabase/supabase-js");
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
                  );
                  await supabase.from("waitlist").upsert([{ email, source: "story" }], { onConflict: "email" });
                  fetch("/api/notify-signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, reason: "Story mode signup" }),
                  }).catch(() => {});
                } catch {}
                handleSignup(email);
              }
            }} className="space-y-3">
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="w-full px-4 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Maybe later
              </button>
            </form>
            <p className="text-white/30 text-xs mt-4 text-center">We will notify you when approved</p>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
export default function ExplorationPage() { return <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white/50">Loading...</div></div>}><ExplorationPageContent /></Suspense>; }
