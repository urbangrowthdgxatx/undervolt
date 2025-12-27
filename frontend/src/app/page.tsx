"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, ArrowUp, BookOpen, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";
import { StoryBlockCard } from "@/components/StoryBlock";
import { MiniChart } from "@/components/MiniChart";
import type { ChatResponse, StoryBlock } from "@/lib/chat-schema";

// Story item can be an insight or a theme (which contains rolled-up insights)
type StoryItem =
  | { type: 'insight'; block: StoryBlock }
  | { type: 'theme'; theme: StoryBlock; insights: StoryBlock[]; expanded: boolean };

export default function StoryBuilder() {
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "**Welcome to Undervolt.** Explore Austin through 1.2 million construction permits.\n\nTry questions like:\n• \"Where is new construction booming?\"\n• \"Which neighborhoods have the most pools?\"\n• \"How has remodeling changed since 2020?\"",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Story state - array of items (insights or themes)
  const [storyItems, setStoryItems] = useState<StoryItem[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Get all unthemed insights (at the top of the list, before any theme)
  const getUnthemedInsights = (): StoryBlock[] => {
    const insights: StoryBlock[] = [];
    for (const item of storyItems) {
      if (item.type === 'insight') {
        insights.push(item.block);
      } else {
        break; // Stop at first theme
      }
    }
    return insights;
  };

  // Get consecutive themes from the top (only if no unthemed insights)
  const getTopThemes = (): { theme: StoryBlock; insights: StoryBlock[] }[] => {
    if (storyItems.length === 0) return [];
    if (storyItems[0].type === 'insight') return []; // Has unthemed insights at top

    const themes: { theme: StoryBlock; insights: StoryBlock[] }[] = [];
    for (const item of storyItems) {
      if (item.type === 'theme') {
        themes.push({ theme: item.theme, insights: item.insights });
      } else {
        break; // Stop at first insight
      }
    }
    return themes;
  };

  // Get all blocks for suggestions
  const getAllBlocks = (): StoryBlock[] => {
    const blocks: StoryBlock[] = [];
    for (const item of storyItems) {
      if (item.type === 'insight') {
        blocks.push(item.block);
      } else {
        blocks.push(...item.insights);
      }
    }
    return blocks;
  };

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
      const res = await fetch("/api/chat-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages.slice(-10),
          existingStory: getAllBlocks().map(b => ({ id: b.id, headline: b.headline, insight: b.insight })),
        }),
      });

      if (!res.ok) throw new Error("API failed");

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
                    console.log("Got response event:", data);
                    console.log("Has storyBlock:", !!data.storyBlock);
                    handleResponse(data as ChatResponse);
                    break;
                  case "done":
                    // Stream completed successfully
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

  // Handle LLM response - new insights go to the TOP
  const handleResponse = (response: ChatResponse) => {
    // API returns 'text' but interface expects 'message'
    const message = response.message || (response as any).text || '';
    setChatMessages((prev) => [...prev, { role: "assistant", content: message }]);

    if (response.storyBlock) {
      // Add new insight to the FRONT (top)
      setStoryItems((prev) => [{ type: 'insight', block: response.storyBlock! }, ...prev]);
    }
  };

  // Fetch suggestions - LLM-powered
  const fetchSuggestions = async (blocks: StoryBlock[]) => {
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedQuestions(data.questions || []);
      }
    } catch {
      // Fallback to default suggestions
      if (blocks.length === 0) {
        setSuggestedQuestions([
          "What's growing fastest?",
          "Show me energy data",
          "Tell me about ZIP 78758",
        ]);
      }
    }
  };

  useEffect(() => {
    fetchSuggestions(getAllBlocks());
  }, [storyItems]);

  // Fallback responses
  const useFallback = (userMessage: string) => {
    const lower = userMessage.toLowerCase();

    if (lower.includes("blackout") || lower.includes("resilience") || lower.includes("survive")) {
      handleResponse({
        message: "**District 10 (Westlake)** leads resilience with **2,151 generators** and **312 batteries**. District 4 (East Austin) has only **175 total energy permits**. Resilience in Austin is a ZIP code lottery.",
        storyBlock: {
          id: `resilience-${Date.now()}`,
          headline: "Resilience is Wealth",
          insight: "District 10 has **12x more generators** than District 4. When the grid fails, geography determines who survives.",
          dataPoint: { label: "generators in D10", value: "2,151" },
          whyStoryWorthy: "equity-gap",
          evidence: [
            { stat: "District 10: 2,151 generators vs District 4: 175 total permits", source: "2019-2024 permit data" },
          ],
          confidence: "high",
          geoData: { type: "comparison", districts: [10, 4], signal: "generator" },
        },
      });
    } else if (lower.includes("freeze") || lower.includes("uri") || lower.includes("2021")) {
      handleResponse({
        message: "Winter Storm Uri in February 2021 broke Austin's trust in the grid. Generator permits spiked **+246%**, batteries **+214%**, and panel upgrades **+52%**.",
        storyBlock: {
          id: `freeze-${Date.now()}`,
          headline: "The Freeze Changed Everything",
          insight: "Post-2021, generator permits jumped **+246%**. Austin isn't just going green—it's hedging against the grid.",
          dataPoint: { label: "generator spike", value: "+246%" },
          whyStoryWorthy: "post-freeze-shift",
          evidence: [
            { stat: "Generator permits: +246% post-2021", source: "Year-over-year permit comparison" },
            { stat: "Battery permits: +214% post-2021", source: "Year-over-year permit comparison" },
          ],
          confidence: "high",
          chartData: {
            type: "bar",
            title: "Generator permits by year",
            data: [
              { name: "2019", value: 412 },
              { name: "2020", value: 523 },
              { name: "2021", value: 1847 },
              { name: "2022", value: 2156 },
              { name: "2023", value: 1892 },
            ],
          },
        },
      });
    } else if (lower.includes("solar") || lower.includes("battery") || lower.includes("storage")) {
      handleResponse({
        message: "Austin installed **25,610 solar panels** but only **878 batteries**. That's a **29:1 ratio**. Storage is the bottleneck.",
        storyBlock: {
          id: `storage-${Date.now()}`,
          headline: "The Storage Paradox",
          insight: "**29 solar systems** for every **1 battery**. Austin generates clean power but can't store it.",
          dataPoint: { label: "solar:battery ratio", value: "29:1" },
          whyStoryWorthy: "paradox",
          evidence: [
            { stat: "25,610 solar permits vs 878 battery permits", source: "2019-2024 permit data" },
          ],
          confidence: "high",
          geoData: { type: "district", districts: [3, 9], signal: "solar" },
        },
      });
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I can help you explore Austin through 1.2 million construction permits. Try asking about:\n\n• **Growth**: \"Where is Austin growing fastest?\"\n• **Luxury**: \"Which neighborhoods have the most pools?\"\n• **Trends**: \"How has construction changed since 2020?\"",
        },
      ]);
    }
  };

  // Remove an item (insight or theme)
  const removeItem = (id: string) => {
    setStoryItems((prev) => prev.filter((item) => {
      if (item.type === 'insight') return item.block.id !== id;
      return item.theme.id !== id;
    }));
  };

  // Unroll a theme back to individual insights
  const unrollTheme = (themeId: string) => {
    setStoryItems((prev) => {
      const newItems: StoryItem[] = [];
      for (const item of prev) {
        if (item.type === 'theme' && item.theme.id === themeId) {
          // Replace theme with its insights
          for (const insight of item.insights) {
            newItems.push({ type: 'insight', block: insight });
          }
        } else {
          newItems.push(item);
        }
      }
      return newItems;
    });
  };

  // Toggle theme expansion
  const toggleThemeExpanded = (themeId: string) => {
    setStoryItems((prev) => prev.map((item) => {
      if (item.type === 'theme' && item.theme.id === themeId) {
        return { ...item, expanded: !item.expanded };
      }
      return item;
    }));
  };

  // Synthesize unthemed insights into a theme
  const synthesizeTheme = async () => {
    const unthemed = getUnthemedInsights();
    if (unthemed.length < 2) return;

    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/story/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: unthemed }),
      });

      if (res.ok) {
        const theme = await res.json();

        // Replace unthemed insights with a theme item
        setStoryItems((prev) => {
          const newItems: StoryItem[] = [];
          let addedTheme = false;

          for (const item of prev) {
            if (item.type === 'insight' && unthemed.some(u => u.id === item.block.id)) {
              // Skip - these are being rolled into the theme
              if (!addedTheme) {
                newItems.push({
                  type: 'theme',
                  theme,
                  insights: unthemed,
                  expanded: false
                });
                addedTheme = true;
              }
            } else {
              newItems.push(item);
            }
          }
          return newItems;
        });
      }
    } catch (error) {
      console.warn("Synthesis failed:", error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Synthesize themes into a meta-theme
  const synthesizeThemes = async () => {
    const topThemes = getTopThemes();
    if (topThemes.length < 2) return;

    setIsSynthesizing(true);
    try {
      // Send the theme summaries to synthesize
      const res = await fetch("/api/story/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: topThemes.map(t => t.theme) }),
      });

      if (res.ok) {
        const metaTheme = await res.json();

        // Collect all insights from the themes being merged
        const allInsights = topThemes.flatMap(t => t.insights);
        const themeIds = topThemes.map(t => t.theme.id);

        // Replace themes with a single meta-theme
        setStoryItems((prev) => {
          const newItems: StoryItem[] = [];
          let addedMetaTheme = false;

          for (const item of prev) {
            if (item.type === 'theme' && themeIds.includes(item.theme.id)) {
              // Skip - being rolled into meta-theme
              if (!addedMetaTheme) {
                newItems.push({
                  type: 'theme',
                  theme: metaTheme,
                  insights: allInsights,
                  expanded: false
                });
                addedMetaTheme = true;
              }
            } else {
              newItems.push(item);
            }
          }
          return newItems;
        });
      }
    } catch (error) {
      console.warn("Theme synthesis failed:", error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const unthemedCount = getUnthemedInsights().length;
  const topThemesCount = getTopThemes().length;
  const totalItems = storyItems.length;

  // Simple markdown renderer for chat messages
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers: ## Title
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(3)}</h3>;
      }
      // Bullet points: - item
      if (line.startsWith('- ')) {
        const content = line.slice(2).split('**').map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-medium">{part}</strong> : part
        );
        return <div key={i} className="text-sm text-white/70 ml-2">• {content}</div>;
      }
      // Numbered list: 1. item
      if (/^\d+\./.test(line)) {
        const content = line.replace(/^\d+\.\s*/, '').split('**').map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-medium">{part}</strong> : part
        );
        return <div key={i} className="text-sm text-white/70 ml-2">{content}</div>;
      }
      // Regular text with bold
      if (line.trim()) {
        const content = line.split('**').map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-medium">{part}</strong> : part
        );
        return <div key={i} className="text-sm text-white/70">{content}</div>;
      }
      // Empty line for spacing
      return <div key={i} className="h-1" />;
    });
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Chat */}
      <div className="w-[420px] border-r border-white/10 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Welcome message - shown only when chat is empty */}
          {chatMessages.length === 0 && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={14} className="text-white/70" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-base font-medium text-white">Welcome to Undervolt</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  I've analyzed **2.3 million construction permits** from Austin (2015-2025) and discovered some surprising patterns.
                </p>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-white/50 uppercase tracking-wider">Key Findings</p>
                  <div className="space-y-1 text-sm text-white/70">
                    <div>🔥 Demolition: <strong className="text-white">+547% CAGR</strong></div>
                    <div>⚡ Batteries: <strong className="text-white">10,377 systems</strong> (4x solar!)</div>
                    <div>🏗️ New Construction: <strong className="text-white">41,234 permits</strong></div>
                  </div>
                </div>
                <p className="text-sm text-white/60">
                  Ask me anything about Austin's construction trends, energy infrastructure, or growth patterns.
                </p>
              </div>
            </div>
          )}

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
                  <div className="flex-1 space-y-1">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              )}
            </div>
          ))}

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
                  chatInput.trim() && !isLoading ? "bg-white text-black" : "bg-white/10 text-white/30"
                }`}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </form>
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
          {totalItems > 0 && (
            <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Story Content */}
        <div className="flex-1 overflow-auto p-6">
          {storyItems.length === 0 ? (
            /* Initial Overview State */
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Hero Stats */}
              <div>
                <h2 className="text-2xl font-light text-white mb-2">Austin Construction: By the Numbers</h2>
                <p className="text-sm text-white/50">2.3M permits analyzed (2015-2025)</p>
              </div>

              {/* Top Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-3xl font-light text-white mb-1">+547%</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Demolition CAGR</div>
                  <div className="text-sm text-white/70 mt-2">Urban redevelopment boom</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-3xl font-light text-white mb-1">10,377</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Battery Systems</div>
                  <div className="text-sm text-white/70 mt-2">4x more than solar!</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-3xl font-light text-white mb-1">41.2%</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">New Construction</div>
                  <div className="text-sm text-white/70 mt-2">Largest permit category</div>
                </div>
              </div>

              {/* Key Insights Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Energy Infrastructure</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Solar installations</span>
                      <strong className="text-white">2,436</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Battery systems</span>
                      <strong className="text-white">10,377</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>EV chargers</span>
                      <strong className="text-white">1,234</strong>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                    18,050 total energy permits
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Top Growth Trends</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Demolition</span>
                      <strong className="text-green-400">+547%</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Battery Storage</span>
                      <strong className="text-green-400">+89%</strong>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Pool Construction</span>
                      <strong className="text-green-400">+67%</strong>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                    CAGR 2020-2025
                  </div>
                </div>
              </div>

              {/* Top ZIP Codes */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-light text-white mb-4">Notable ZIP Codes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-white/70 mb-1">⚡ Battery Hub</div>
                    <div className="text-2xl font-light text-white">78758</div>
                    <div className="text-xs text-white/50 mt-1">801 battery systems</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/70 mb-1">☀️ Solar Leader</div>
                    <div className="text-2xl font-light text-white">78744</div>
                    <div className="text-xs text-white/50 mt-1">572 installations</div>
                  </div>
                </div>
              </div>

              {/* Try Asking Section */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-6">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Dig Deeper</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setChatInput("What's growing fastest?")}
                    className="block w-full text-left text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors"
                  >
                    💬 What's growing fastest in Austin?
                  </button>
                  <button
                    onClick={() => setChatInput("Show me energy data")}
                    className="block w-full text-left text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors"
                  >
                    ⚡ Show me energy infrastructure data
                  </button>
                  <button
                    onClick={() => setChatInput("Tell me about ZIP 78758")}
                    className="block w-full text-left text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors"
                  >
                    📍 Tell me about ZIP 78758
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Story Items */
            <div className={`space-y-4 ${isSynthesizing ? "opacity-50" : ""}`}>
              {storyItems.map((item) => (
                item.type === 'insight' ? (
                  /* Regular insight card */
                  <StoryBlockCard
                    key={item.block.id}
                    block={item.block}
                    onRemove={removeItem}
                  />
                ) : (
                  /* Theme with collapsed insights */
                  <div key={item.theme.id} className="border border-white/20 rounded-xl bg-gradient-to-br from-white/10 to-white/5 overflow-hidden">
                    {/* Theme header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={12} className="text-white/60" />
                            <span className="text-xs text-white/40 uppercase tracking-wider">Theme</span>
                          </div>
                          <h3 className="text-lg font-light text-white">{item.theme.headline}</h3>
                          <p className="text-sm text-white/60 mt-2 leading-relaxed">
                            {item.theme.insight.split("**").map((part, i) =>
                              i % 2 === 1 ? (
                                <strong key={i} className="text-white font-medium">{part}</strong>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => unrollTheme(item.theme.id)}
                          className="text-white/30 hover:text-white p-1 ml-2"
                          title="Unroll to insights"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Collapsed insights */}
                    <div className="border-t border-white/10">
                      <button
                        onClick={() => toggleThemeExpanded(item.theme.id)}
                        className="w-full flex items-center gap-2 px-5 py-3 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {item.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {item.insights.length} insight{item.insights.length !== 1 ? "s" : ""} rolled up
                      </button>

                      {item.expanded && (
                        <div className="px-5 pb-4 space-y-4">
                          {item.insights.map((insight) => (
                            <div
                              key={insight.id}
                              className="bg-white/5 rounded-lg p-4 border border-white/5"
                            >
                              {/* Headline + Data Point */}
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h4 className="text-sm font-medium text-white">{insight.headline}</h4>
                                {insight.dataPoint && (
                                  <div className="flex-shrink-0 bg-white/10 rounded px-2 py-1">
                                    <span className="text-lg font-light text-white">{insight.dataPoint.value}</span>
                                    <span className="text-xs text-white/40 ml-1">{insight.dataPoint.label}</span>
                                  </div>
                                )}
                              </div>

                              {/* Full Insight */}
                              <p className="text-sm text-white/60 leading-relaxed">
                                {insight.insight.split("**").map((part, i) =>
                                  i % 2 === 1 ? (
                                    <strong key={i} className="text-white/80 font-medium">{part}</strong>
                                  ) : (
                                    part
                                  )
                                )}
                              </p>

                              {/* Evidence */}
                              {insight.evidence && insight.evidence.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                  {insight.evidence.map((ev, i) => (
                                    <p key={i} className="text-xs text-white/40">
                                      {ev.stat} <span className="text-white/20">· {ev.source}</span>
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Chart if available */}
                              {insight.chartData && (
                                <div className="mt-3">
                                  <MiniChart chartData={insight.chartData} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}

              {isSynthesizing && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/40 py-4">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Finding the theme...</span>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Next Angles - Fixed at bottom */}
        {suggestedQuestions.length > 0 && storyItems.length > 0 && !isLoading && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles size={10} />
              Next angles
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(q)}
                  className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Story Footer */}
        {storyItems.length > 0 && (
          <div className="p-4 border-t border-white/10">
            {/* Synthesize insights button */}
            {unthemedCount >= 2 && (
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
                    <span>Roll up {unthemedCount} insights</span>
                  </>
                )}
              </button>
            )}

            {/* Synthesize themes button - show when 2+ themes at top and no unthemed insights */}
            {topThemesCount >= 2 && unthemedCount === 0 && (
              <button
                onClick={synthesizeThemes}
                disabled={isSynthesizing}
                className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Roll up {topThemesCount} themes</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-white/30">
                {unthemedCount > 0 && `${unthemedCount} insight${unthemedCount !== 1 ? "s" : ""}`}
                {unthemedCount > 0 && storyItems.length > unthemedCount && " + "}
                {storyItems.length - unthemedCount > 0 && `${storyItems.length - unthemedCount} theme${storyItems.length - unthemedCount !== 1 ? "s" : ""}`}
              </p>
              <button
                onClick={() => setStoryItems([])}
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
