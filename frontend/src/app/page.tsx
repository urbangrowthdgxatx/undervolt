"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, ArrowUp, BookOpen, Sparkles } from "lucide-react";
import { StoryBlockCard } from "@/components/StoryBlock";
import type { ChatResponse, StoryBlock } from "@/lib/chat-schema";

export default function StoryBuilder() {
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "**Welcome to Undervolt.** Ask me anything about Austin's energy infrastructure.\n\nTry questions like:\n• \"Who can survive a blackout?\"\n• \"What changed after the freeze?\"\n• \"Where is the solar-battery gap?\"",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Story state
  const [storyBlocks, setStoryBlocks] = useState<StoryBlock[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedTheme, setSynthesizedTheme] = useState<StoryBlock | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle chat submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsLoading(true);
    setThinkingStatus("Connecting...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages.slice(-10), // Last 10 messages for context
          existingStory: storyBlocks.map(b => ({ id: b.id, headline: b.headline, insight: b.insight })),
        }),
      });

      if (!res.ok) throw new Error("API failed");

      // Handle SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine?.startsWith("data: ")) {
              try {
                const data = JSON.parse(dataLine.slice(6));

                switch (eventType) {
                  case "status":
                    setThinkingStatus(data.message);
                    break;
                  case "tool-call":
                    setThinkingStatus(`Querying ${data.name}...`);
                    break;
                  case "tool-result":
                    setThinkingStatus("Analyzing...");
                    break;
                  case "response":
                    handleResponse(data as ChatResponse);
                    break;
                  case "error":
                    console.error("Stream error:", data);
                    useFallback(userMessage);
                    break;
                }
              } catch {
                // Skip parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn("Chat API error:", error);
      useFallback(userMessage);
    } finally {
      setIsLoading(false);
      setThinkingStatus("");
    }
  };

  // Handle LLM response
  const handleResponse = (response: ChatResponse) => {
    setChatMessages((prev) => [...prev, { role: "assistant", content: response.message }]);

    // Add story block if present
    if (response.storyBlock) {
      setStoryBlocks((prev) => [...prev, response.storyBlock!]);
    }
  };

  // Fetch suggestions when story changes
  const fetchSuggestions = async (blocks: StoryBlock[]) => {
    try {
      const res = await fetch("/api/story/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedQuestions(data.questions || []);
      }
    } catch {
      // Use fallback suggestions
      if (blocks.length === 0) {
        setSuggestedQuestions([
          "Who survives blackouts in Austin?",
          "What changed after the 2021 freeze?",
          "Where's the solar-battery gap?",
        ]);
      }
    }
  };

  // Update suggestions when story blocks change
  useEffect(() => {
    fetchSuggestions(storyBlocks);
  }, [storyBlocks]);

  // Fallback for when API fails
  const useFallback = (userMessage: string) => {
    const lower = userMessage.toLowerCase();
    const existingIds = storyBlocks.map(b => b.id);

    // Simple keyword matching for fallback
    if (lower.includes("blackout") || lower.includes("resilience") || lower.includes("survive")) {
      const connectsTo = existingIds.includes("freeze-impact") ? ["freeze-impact"] : [];
      handleResponse({
        message: "**District 10 (Westlake)** leads resilience with **2,151 generators** and **312 batteries**. District 4 (East Austin) has only **175 total energy permits**. Resilience in Austin is a ZIP code lottery.",
        storyBlock: {
          id: "resilience-gap",
          headline: "Resilience is Wealth",
          insight: "District 10 has **12x more generators** than District 4. When the grid fails, geography determines who survives.",
          dataPoint: { label: "generators in D10", value: "2,151" },
          connectsTo: connectsTo.length > 0 ? connectsTo : null,
          connectionReason: connectsTo.length > 0 ? "The freeze drove wealthy areas to invest in backup power" : null,
        },
      });
    } else if (lower.includes("freeze") || lower.includes("uri") || lower.includes("2021")) {
      const connectsTo = existingIds.includes("resilience-gap") ? ["resilience-gap"] :
                         existingIds.includes("storage-gap") ? ["storage-gap"] : [];
      handleResponse({
        message: "Winter Storm Uri in February 2021 broke Austin's trust in the grid. Generator permits spiked **+246%**, batteries **+214%**, and panel upgrades **+52%**. People stopped waiting for the grid to be fixed.",
        storyBlock: {
          id: "freeze-impact",
          headline: "The Freeze Changed Everything",
          insight: "Post-2021, generator permits jumped **+246%**. Austin isn't just going green—it's hedging against the grid.",
          dataPoint: { label: "generator spike", value: "+246%" },
          connectsTo: connectsTo.length > 0 ? connectsTo : null,
          connectionReason: connectsTo.length > 0 ? "This event explains the current patterns" : null,
        },
      });
    } else if (lower.includes("solar") && lower.includes("battery") || lower.includes("storage") || lower.includes("paradox")) {
      const connectsTo = existingIds.includes("freeze-impact") ? ["freeze-impact"] :
                         existingIds.includes("panel-strain") ? ["panel-strain"] : [];
      handleResponse({
        message: "Austin installed **25,610 solar panels** but only **878 batteries**. That's a **29:1 ratio**. When the grid fails, all that solar generation goes dark. Storage is the bottleneck.",
        storyBlock: {
          id: "storage-gap",
          headline: "The Storage Paradox",
          insight: "**29 solar systems** for every **1 battery**. Austin generates clean power but can't store it.",
          dataPoint: { label: "solar:battery ratio", value: "29:1" },
          connectsTo: connectsTo.length > 0 ? connectsTo : null,
          connectionReason: connectsTo.length > 0 ? "Both reveal infrastructure gaps in Austin's grid" : null,
        },
      });
    } else if (lower.includes("panel") || lower.includes("upgrade") || lower.includes("infrastructure")) {
      const connectsTo = existingIds.includes("storage-gap") ? ["storage-gap"] :
                         existingIds.includes("freeze-impact") ? ["freeze-impact"] : [];
      handleResponse({
        message: "**3,072+ panel upgrades** in the dataset, growing **+52% YoY**. Homes are hitting the limits of 50-year-old electrical systems. EVs, solar, and heat pumps all demand more power than old panels can deliver.",
        storyBlock: {
          id: "panel-strain",
          headline: "Infrastructure Under Strain",
          insight: "Panel upgrades up **+52% YoY**. The electrical grid inside homes is the hidden bottleneck.",
          dataPoint: { label: "YoY growth", value: "+52%" },
          connectsTo: connectsTo.length > 0 ? connectsTo : null,
          connectionReason: connectsTo.length > 0 ? "Another sign of infrastructure struggling to keep up" : null,
        },
      });
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I can help you explore Austin's energy infrastructure. Try asking about:\n\n• **Resilience**: \"Who survives blackouts?\"\n• **The Freeze**: \"What changed after 2021?\"\n• **Storage**: \"Where's the solar-battery gap?\"\n• **Infrastructure**: \"What about panel upgrades?\"",
        },
      ]);
    }
  };

  // Remove story block
  const removeStoryBlock = async (id: string) => {
    // If removing the theme, just clear it
    if (synthesizedTheme?.id === id) {
      setSynthesizedTheme(null);
      return;
    }

    const remaining = storyBlocks.filter((b) => b.id !== id);
    setStoryBlocks(remaining);

    // Clear theme if we now have fewer than 2 blocks
    if (remaining.length < 2) {
      setSynthesizedTheme(null);
    }

    // Regenerate connections if more than 1 block remains
    if (remaining.length > 1) {
      setIsRegenerating(true);
      try {
        const res = await fetch("/api/story/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocks: remaining }),
        });
        if (res.ok) {
          const updated = await res.json();
          setStoryBlocks(updated);
        }
      } catch (error) {
        console.warn("Regeneration failed:", error);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  // Synthesize insights into a theme
  const synthesizeTheme = async () => {
    if (storyBlocks.length < 2) return;

    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/story/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: storyBlocks }),
      });
      if (res.ok) {
        const theme = await res.json();
        setSynthesizedTheme(theme);
      }
    } catch (error) {
      console.warn("Synthesis failed:", error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Get connected blocks for a given block
  const getConnectedBlocks = (block: StoryBlock): StoryBlock[] => {
    if (!block.connectsTo || block.connectsTo.length === 0) return [];
    return storyBlocks.filter((b) => block.connectsTo?.includes(b.id));
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Chat */}
      <div className="w-[420px] border-r border-white/10 flex flex-col">

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
              {msg.role === "user" ? (
                <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={14} className="text-white/70" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                      {msg.content.split("**").map((part, j) =>
                        j % 2 === 1 ? (
                          <strong key={j} className="text-white font-medium">
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <div className="flex-1">
                <span className="text-sm text-white/50">{thinkingStatus || "Thinking..."}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleChatSubmit}>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about Austin's energy..."
                disabled={isLoading}
                className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isLoading}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  chatInput.trim() && !isLoading
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/30"
                }`}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </form>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && !isLoading && (
            <div className="mt-3 space-y-1.5">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(q)}
                  className="block w-full text-left text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Storybook */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-white/50" />
            <h2 className="text-lg font-light text-white">Your Story</h2>
          </div>
          {storyBlocks.length > 0 && (
            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
              {storyBlocks.length} insight{storyBlocks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Story Content */}
        <div className="flex-1 overflow-auto p-6">
          {storyBlocks.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <BookOpen size={24} className="text-white/30" />
              </div>
              <h3 className="text-lg font-light text-white mb-2">Your Austin Story</h3>
              <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                Ask questions on the left to discover insights. Story-worthy findings will appear here.
              </p>
              <div className="mt-8 space-y-2 text-left">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Try asking</p>
                <button
                  onClick={() => setChatInput("Who can survive a blackout in Austin?")}
                  className="block w-full text-left text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-2 transition-colors"
                >
                  &ldquo;Who can survive a blackout?&rdquo;
                </button>
                <button
                  onClick={() => setChatInput("What changed after the freeze?")}
                  className="block w-full text-left text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-2 transition-colors"
                >
                  &ldquo;What changed after the freeze?&rdquo;
                </button>
                <button
                  onClick={() => setChatInput("Where is the solar-battery gap?")}
                  className="block w-full text-left text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-2 transition-colors"
                >
                  &ldquo;Where is the solar-battery gap?&rdquo;
                </button>
              </div>
            </div>
          ) : (
            /* Story Blocks */
            <div className={`space-y-6 ${isRegenerating || isSynthesizing ? "opacity-50" : ""}`}>
              {/* Synthesized Theme at top */}
              {synthesizedTheme && (
                <div className="mb-8">
                  <StoryBlockCard
                    block={synthesizedTheme}
                    onRemove={removeStoryBlock}
                    connectedBlocks={storyBlocks}
                    isTheme={true}
                  />
                  <div className="mt-4 flex justify-center">
                    <div className="h-8 w-px bg-white/20" />
                  </div>
                </div>
              )}

              {/* Individual insight blocks */}
              {storyBlocks.map((block) => (
                <StoryBlockCard
                  key={block.id}
                  block={block}
                  onRemove={removeStoryBlock}
                  connectedBlocks={getConnectedBlocks(block)}
                />
              ))}

              {/* Loading states */}
              {isRegenerating && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reweaving connections...</span>
                </div>
              )}
              {isSynthesizing && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Finding the bigger picture...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Story Footer */}
        {storyBlocks.length > 0 && (
        <div className="p-4 border-t border-white/10">
          {/* Synthesize button */}
          {storyBlocks.length >= 2 && !synthesizedTheme && (
            <button
              onClick={synthesizeTheme}
              disabled={isSynthesizing}
              className="w-full mb-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Find the Theme</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30">
              {storyBlocks.length} insight{storyBlocks.length !== 1 ? "s" : ""}
              {synthesizedTheme ? " + 1 theme" : ""}
            </p>
            <button
              onClick={() => {
                setStoryBlocks([]);
                setSynthesizedTheme(null);
              }}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
