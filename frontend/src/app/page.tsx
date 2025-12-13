"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Sun, Battery, Home, Gauge, ChevronRight, Play, RotateCcw, MessageSquare, Compass, ArrowUp, Pause } from "lucide-react";
import { PermitMap, SignalType } from "@/components/PermitMap";

// Narrative stages
interface NarrativeStage {
  id: number;
  title: string;
  subtitle: string;
  narrative: string;
  mapFilter: SignalType | SignalType[];
  stats: Array<{
    label: string;
    value: string;
    subtext?: string;
    highlight?: boolean;
  }>;
  insight: string;
  insightType: "neutral" | "positive" | "warning" | "critical";
}

const narrativeStages: NarrativeStage[] = [
  {
    id: 0,
    title: "Austin's Energy Landscape",
    subtitle: "80,000 permits tell a story",
    narrative: "From construction permits, we extracted 2,213 energy-related signals. Each dot represents a home making choices about their energy future.",
    mapFilter: "all",
    stats: [
      { label: "Total Permits", value: "79,661", subtext: "analyzed" },
      { label: "Energy Signals", value: "2,213", subtext: "extracted" },
      { label: "Geocoded", value: "63%", subtext: "mappable" },
      { label: "Time Span", value: "2019-2024", subtext: "5 years" },
    ],
    insight: "Every marker is a decision. Together, they reveal where Austin is heading.",
    insightType: "neutral",
  },
  {
    id: 1,
    title: "The Frontier Is Here",
    subtitle: "Solar + EV adoption is real",
    narrative: "Solar installations and EV chargers are spreading across Austin. This is frontier behavior — households investing in cleaner, electrified living.",
    mapFilter: ["solar", "ev"],
    stats: [
      { label: "Solar", value: "580", subtext: "installations", highlight: true },
      { label: "EV Chargers", value: "529", subtext: "permits", highlight: true },
      { label: "Solar Growth", value: "+28%", subtext: "YoY" },
      { label: "EV Growth", value: "+34%", subtext: "YoY" },
    ],
    insight: "Austin is going green. Solar and EV adoption are growing faster than the national average.",
    insightType: "positive",
  },
  {
    id: 2,
    title: "But Look Closer",
    subtitle: "Generators reveal distrust",
    narrative: "634 generator permits. That's more than EV chargers. After the 2021 freeze, Austinites aren't just going green — they're hedging their bets.",
    mapFilter: "generator",
    stats: [
      { label: "Generators", value: "634", subtext: "permits", highlight: true },
      { label: "Post-Freeze Spike", value: "+47%", subtext: "since 2021" },
      { label: "Avg Size", value: "22 kW", subtext: "whole-home" },
      { label: "Top Zip", value: "78746", subtext: "Westlake" },
    ],
    insight: "Generator count nearly matches solar. People are going green AND preparing for grid failure.",
    insightType: "warning",
  },
  {
    id: 3,
    title: "The Bottleneck",
    subtitle: "Storage lags behind generation",
    narrative: "Only 87 battery installations. Generation is growing, but storage isn't keeping pace. Meanwhile, ADUs add density and increase load.",
    mapFilter: ["battery", "adu"],
    stats: [
      { label: "Batteries", value: "87", subtext: "only", highlight: true },
      { label: "ADUs", value: "383", subtext: "adding load" },
      { label: "Solar:Battery", value: "7:1", subtext: "ratio" },
      { label: "Density Growth", value: "+42%", subtext: "YoY" },
    ],
    insight: "For every 7 solar systems, only 1 battery. Austin generates power but can't store it.",
    insightType: "critical",
  },
  {
    id: 4,
    title: "The Constraint",
    subtitle: "Energy is the bottleneck to the frontier",
    narrative: "Austin is transitioning to a cleaner, more electrified future. But that future increases demand and complexity. Energy reliability becomes the constraint.",
    mapFilter: "all",
    stats: [
      { label: "Generation", value: "Growing", subtext: "solar +28%" },
      { label: "Demand", value: "Rising", subtext: "EVs + ADUs" },
      { label: "Storage", value: "Lagging", subtext: "only 87" },
      { label: "Trust", value: "Mixed", subtext: "634 generators" },
    ],
    insight: "This isn't failure — it's transition under constraint. The permits show us where to invest next.",
    insightType: "neutral",
  },
];

// Chat responses for explore mode
interface ChatResponse {
  message: string;
  mapFilter: SignalType | SignalType[];
  highlightZip?: string;
}

const chatResponses: Record<string, ChatResponse> = {
  "show ev chargers": {
    message: "Here are all **529 EV charger** permits. Notice the clustering in South Austin (78704) and Westlake (78746) — areas with newer homes and garage access.",
    mapFilter: "ev",
  },
  "show solar": {
    message: "**580 solar installations** across Austin. West Austin leads with larger systems (20+ kW), while East Austin averages 12 kW. Summer months show peak installation activity.",
    mapFilter: "solar",
  },
  "show batteries": {
    message: "Only **87 battery** installations — the scarcest signal. 78% are paired with solar. Tesla Powerwall dominates with 82% market share.",
    mapFilter: "battery",
  },
  "show generators": {
    message: "**634 generators** — more than EV chargers. Post-2021 freeze, generator permits spiked 47%. Westlake (78746) leads with 3x the city average.",
    mapFilter: "generator",
  },
  "show adus": {
    message: "**383 ADUs** adding density to Austin. Central neighborhoods (78704, 78702) lead — older lots with space for backyard units. Average size: 650 sqft.",
    mapFilter: "adu",
  },
  "show all": {
    message: "All **2,213 energy signals** on the map. West Austin dominates resilience (solar, batteries, generators). Central/East leads density (ADUs).",
    mapFilter: "all",
  },
  "westlake": {
    message: "**78746 (Westlake)** — highest grid resilience in Austin. Leads in generators, batteries, and large solar systems. Affluent area investing in energy independence.",
    mapFilter: "all",
    highlightZip: "78746",
  },
  "78704": {
    message: "**78704 (South Austin)** — EV charger hotspot with 142 permits. Also leads ADU construction. Younger, eco-conscious demographic with garage access.",
    mapFilter: "all",
    highlightZip: "78704",
  },
  "east austin": {
    message: "**East Austin (78702, 78723)** — density growth center. Leads in ADUs and multi-family. Lower resilience scores but highest housing growth.",
    mapFilter: ["adu", "ev"],
    highlightZip: "78702",
  },
  "resilience": {
    message: "Grid resilience = generators + batteries + solar. **West Austin leads**, East Austin shows vulnerability. The 2021 freeze drove a 47% spike in backup power.",
    mapFilter: ["generator", "battery", "solar"],
  },
  "bottleneck": {
    message: "The bottleneck: **storage lags generation**. Solar:Battery ratio is 7:1. Austin can generate clean power but can't store it for when the grid fails.",
    mapFilter: ["battery", "solar"],
  },
  "frontier": {
    message: "The frontier is real: **Solar (+28% YoY)** and **EV chargers (+34% YoY)** are spreading. Austin households are investing in electrified living.",
    mapFilter: ["solar", "ev"],
  },
};

type Mode = "narrative" | "explore";

export default function NarrativeDashboard() {
  const [mode, setMode] = useState<Mode>("narrative");
  const [currentStage, setCurrentStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Explore mode state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [exploreFilter, setExploreFilter] = useState<SignalType | SignalType[]>("all");
  const [exploreHighlightZip, setExploreHighlightZip] = useState<string | undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const stage = narrativeStages[currentStage];

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && currentStage < narrativeStages.length - 1) {
      const timer = setTimeout(() => {
        goToNextStage();
      }, 5000);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStage === narrativeStages.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStage]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const goToNextStage = () => {
    if (currentStage < narrativeStages.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStage((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const goToPrevStage = () => {
    if (currentStage > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStage((prev) => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const restart = () => {
    setIsTransitioning(true);
    setIsPlaying(false);
    setTimeout(() => {
      setCurrentStage(0);
      setIsTransitioning(false);
    }, 300);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");

    // Find matching response
    const normalizedInput = userMessage.toLowerCase();
    let response: ChatResponse | null = null;

    for (const [key, value] of Object.entries(chatResponses)) {
      if (normalizedInput.includes(key)) {
        response = value;
        break;
      }
    }

    setTimeout(() => {
      if (response) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: response!.message }]);
        setExploreFilter(response.mapFilter);
        setExploreHighlightZip(response.highlightZip);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Try asking about:\n• **show solar** / **show ev chargers** / **show generators**\n• **show batteries** / **show adus** / **show all**\n• **westlake** / **78704** / **east austin**\n• **resilience** / **bottleneck** / **frontier**",
          },
        ]);
      }
    }, 500);
  };

  const switchToExplore = () => {
    setMode("explore");
    setIsPlaying(false);
    setChatMessages([
      {
        role: "assistant",
        content: "Now in **explore mode**. Ask me anything about Austin's infrastructure:\n\n• \"Show solar\" or \"Show generators\"\n• \"What's happening in Westlake?\"\n• \"Show me the bottleneck\"",
      },
    ]);
  };

  const switchToNarrative = () => {
    setMode("narrative");
    setChatMessages([]);
    setExploreFilter("all");
    setExploreHighlightZip(undefined);
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case "positive":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "critical":
        return "border-red-500/30 bg-red-500/5";
      default:
        return "border-[#262626] bg-[#141414]";
    }
  };

  const getInsightTextStyle = (type: string) => {
    switch (type) {
      case "positive":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  };

  const getMapFilter = (): SignalType | SignalType[] => {
    return mode === "narrative" ? stage.mapFilter : exploreFilter;
  };

  const getHighlightZip = (): string | undefined => {
    return mode === "explore" ? exploreHighlightZip : undefined;
  };

  // Quick action buttons for explore mode
  const quickActions = [
    { label: "Solar", filter: "solar" as SignalType },
    { label: "EV", filter: "ev" as SignalType },
    { label: "Generators", filter: "generator" as SignalType },
    { label: "Batteries", filter: "battery" as SignalType },
    { label: "ADUs", filter: "adu" as SignalType },
    { label: "All", filter: "all" as SignalType },
  ];

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-[480px] border-r border-[#1a1a1a] flex flex-col">
        {/* Mode Toggle */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex bg-[#141414] rounded-lg p-1">
            <button
              onClick={switchToNarrative}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                mode === "narrative"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Play size={14} />
              Story
            </button>
            <button
              onClick={switchToExplore}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                mode === "explore"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Compass size={14} />
              Explore
            </button>
          </div>
        </div>

        {mode === "narrative" ? (
          <>
            {/* Narrative Header */}
            <div className="p-6 border-b border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {narrativeStages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setCurrentStage(i);
                          setIsTransitioning(false);
                        }, 300);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStage
                          ? "w-8 bg-white"
                          : i < currentStage
                          ? "w-4 bg-white/50"
                          : "w-4 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {currentStage + 1} / {narrativeStages.length}
                </span>
              </div>

              <div
                className={`transition-opacity duration-300 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                <h1 className="text-2xl font-light text-white">{stage.title}</h1>
                <p className="text-gray-500 text-sm mt-1">{stage.subtitle}</p>
              </div>
            </div>

            {/* Narrative Text */}
            <div
              className={`p-6 transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <p className="text-gray-300 text-lg leading-relaxed font-light">
                {stage.narrative}
              </p>
            </div>

            {/* Stats Grid */}
            <div
              className={`px-6 grid grid-cols-2 gap-3 transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {stage.stats.map((stat, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 transition-all ${
                    stat.highlight
                      ? "bg-white/10 border border-white/20"
                      : "bg-[#141414] border border-[#262626]"
                  }`}
                >
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p
                    className={`text-2xl font-light ${
                      stat.highlight ? "text-white" : "text-gray-200"
                    }`}
                  >
                    {stat.value}
                  </p>
                  {stat.subtext && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Insight Box */}
            <div className="flex-1" />
            <div
              className={`mx-6 mb-6 p-4 rounded-xl border transition-all duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              } ${getInsightStyle(stage.insightType)}`}
            >
              <p className={`text-sm leading-relaxed ${getInsightTextStyle(stage.insightType)}`}>
                {stage.insight}
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="p-6 border-t border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={restart}
                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#333] transition-colors"
                    title="Restart"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                      isPlaying
                        ? "bg-white text-black border-white"
                        : "bg-[#1a1a1a] border-[#262626] text-gray-400 hover:text-white hover:border-[#333]"
                    }`}
                    title={isPlaying ? "Pause" : "Auto-play"}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevStage}
                    disabled={currentStage === 0}
                    className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-white hover:border-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  {currentStage === narrativeStages.length - 1 ? (
                    <button
                      onClick={switchToExplore}
                      className="px-4 py-2 rounded-lg bg-white text-black font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      Explore <Compass size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={goToNextStage}
                      className="px-4 py-2 rounded-lg bg-white text-black font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Explore Mode Header */}
            <div className="p-6 border-b border-[#1a1a1a]">
              <h1 className="text-2xl font-light text-white">Explore Mode</h1>
              <p className="text-gray-500 text-sm mt-1">Ask questions about Austin&apos;s infrastructure</p>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 border-b border-[#1a1a1a]">
              <p className="text-xs text-gray-500 mb-3">Quick filters</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setExploreFilter(action.filter);
                      setExploreHighlightZip(undefined);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      exploreFilter === action.filter
                        ? "bg-white text-black"
                        : "bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:text-white hover:border-[#333]"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
                  {msg.role === "user" ? (
                    <div className="bg-[#262626] rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                      <p className="text-sm text-white">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={14} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
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
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-[#1a1a1a]">
              <form onSubmit={handleChatSubmit}>
                <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 focus-within:border-[#333]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about Austin's infrastructure..."
                    className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      chatInput.trim()
                        ? "bg-white text-black"
                        : "bg-[#262626] text-gray-500"
                    }`}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Map Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-light text-white">
              {mode === "narrative" ? stage.title : "Infrastructure Map"}
            </h2>
            <p className="text-sm text-gray-500">
              {(() => {
                const filter = getMapFilter();
                if (Array.isArray(filter)) {
                  return filter.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(" + ");
                }
                return filter === "all" ? "All Signals" : filter.charAt(0).toUpperCase() + filter.slice(1);
              })()}
              {getHighlightZip() && ` • ${getHighlightZip()}`}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-gray-400">EV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#eab308]" />
              <span className="text-gray-400">Solar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              <span className="text-gray-400">Battery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
              <span className="text-gray-400">ADU</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#f97316]" />
              <span className="text-gray-400">Generator</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div
          className={`flex-1 rounded-xl overflow-hidden border border-[#262626] transition-opacity duration-500 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        >
          <PermitMap
            filter={getMapFilter()}
            highlightZip={getHighlightZip()}
            className="h-full"
          />
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          {[
            { key: "ev", icon: Zap, color: "#22c55e", label: "EV Chargers", value: "529" },
            { key: "solar", icon: Sun, color: "#eab308", label: "Solar", value: "580" },
            { key: "battery", icon: Battery, color: "#3b82f6", label: "Battery", value: "87" },
            { key: "adu", icon: Home, color: "#a855f7", label: "ADU", value: "383" },
            { key: "generator", icon: Gauge, color: "#f97316", label: "Generator", value: "634" },
          ].map((item) => {
            const filter = getMapFilter();
            const isActive =
              filter === "all" ||
              filter === item.key ||
              (Array.isArray(filter) && filter.includes(item.key as SignalType));
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => {
                  if (mode === "explore") {
                    setExploreFilter(item.key as SignalType);
                    setExploreHighlightZip(undefined);
                  }
                }}
                className={`rounded-lg p-3 border transition-all text-left ${
                  isActive
                    ? `bg-[${item.color}]/10 border-[${item.color}]/30`
                    : "bg-[#141414] border-[#262626] opacity-30"
                } ${mode === "explore" ? "cursor-pointer hover:opacity-100" : ""}`}
                style={isActive ? { backgroundColor: `${item.color}10`, borderColor: `${item.color}50` } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: item.color }} />
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <p className="text-xl font-light text-white">{item.value}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
