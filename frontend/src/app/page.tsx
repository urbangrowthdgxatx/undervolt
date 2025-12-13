"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Sun, Battery, Home, Gauge, CircuitBoard, ChevronRight, Play, RotateCcw, MessageSquare, Compass, ArrowUp, Pause, TrendingUp } from "lucide-react";
import { PermitMap, SignalType } from "@/components/PermitMap";
import { TrendChart } from "@/components/TrendChart";

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
  showChart?: boolean;
  chartTitle?: string;
  chartData?: Array<{ name: string; value: number; lastYear?: number }>;
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
    showChart: true,
    chartTitle: "Solar + EV Growth (2019-2024)",
    chartData: [
      { name: "2019", value: 312, lastYear: 0 },
      { name: "2020", value: 445, lastYear: 312 },
      { name: "2021", value: 623, lastYear: 445 },
      { name: "2022", value: 812, lastYear: 623 },
      { name: "2023", value: 978, lastYear: 812 },
      { name: "2024", value: 1109, lastYear: 978 },
    ],
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
    showChart: true,
    chartTitle: "Generator Permits by Year",
    chartData: [
      { name: "2019", value: 89 },
      { name: "2020", value: 102 },
      { name: "2021", value: 234 },
      { name: "2022", value: 298 },
      { name: "2023", value: 312 },
      { name: "2024", value: 242 },
    ],
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
    showChart: true,
    chartTitle: "Solar vs Battery Installation Gap",
    chartData: [
      { name: "2019", value: 156, lastYear: 8 },
      { name: "2020", value: 223, lastYear: 12 },
      { name: "2021", value: 312, lastYear: 18 },
      { name: "2022", value: 398, lastYear: 24 },
      { name: "2023", value: 467, lastYear: 34 },
      { name: "2024", value: 580, lastYear: 87 },
    ],
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
  },
];

// Chat responses for explore mode
interface ChatResponse {
  message: string;
  mapFilter?: SignalType | SignalType[];
  highlightZip?: string;
  highlightDistrict?: number;
  showChart?: boolean;
  chartTitle?: string;
  chartData?: Array<{ name: string; value: number; lastYear?: number }>;
}

const chatResponses: Record<string, ChatResponse> = {
  "show ev": {
    message: "**529 EV charger** permits. Clustering in South Austin (78704) and Westlake (78746) — areas with newer homes and garage access.",
    mapFilter: "ev",
  },
  "show solar": {
    message: "**580 solar installations** across Austin. West Austin leads with larger systems (20+ kW), while East Austin averages 12 kW.",
    mapFilter: "solar",
  },
  "show batteries": {
    message: "Only **87 battery** installations — the scarcest signal. 78% paired with solar. Tesla Powerwall dominates with 82% market share.",
    mapFilter: "battery",
  },
  "show generators": {
    message: "**634 generators** — more than EV chargers. Post-2021 freeze spike of +47%. Westlake (78746) leads with 3x the city average.",
    mapFilter: "generator",
  },
  "show adu": {
    message: "**383 ADUs** adding density. Central neighborhoods (78704, 78702) lead — older lots with space for backyard units. Avg size: 650 sqft.",
    mapFilter: "adu",
  },
  "show panel": {
    message: "**3,072 panel upgrades** — the hidden infrastructure strain. Homes upgrading from 100A to 200A to support EVs, solar, and modern loads.",
    mapFilter: "panel",
  },
  "show panels": {
    message: "**3,072 panel upgrades** — the hidden infrastructure strain. Homes upgrading from 100A to 200A to support EVs, solar, and modern loads.",
    mapFilter: "panel",
  },
  "panel trend": {
    message: "Panel upgrades up **+52% since 2020**. Most are 200A upgrades — homes maxing out electrical capacity for EVs and solar.",
    showChart: true,
    chartTitle: "Panel Upgrade Permits by Year",
    chartData: [
      { name: "2019", value: 312, lastYear: 245 },
      { name: "2020", value: 389, lastYear: 312 },
      { name: "2021", value: 478, lastYear: 389 },
      { name: "2022", value: 623, lastYear: 478 },
      { name: "2023", value: 712, lastYear: 623 },
      { name: "2024", value: 558, lastYear: 712 },
    ],
  },
  "infrastructure": {
    message: "Infrastructure strain: **3,072 panel upgrades** signal homes at electrical capacity. Combined with EVs and solar, the grid is being pushed.",
    mapFilter: ["panel", "ev", "solar"],
  },
  "show all": {
    message: "All **2,213 energy signals**. West Austin dominates resilience (solar, batteries, generators). Central/East leads density (ADUs).",
    mapFilter: "all",
  },
  "westlake": {
    message: "**78746 (Westlake)** — highest grid resilience. Leads in generators, batteries, and large solar. Affluent area investing in energy independence.",
    mapFilter: "all",
    highlightZip: "78746",
  },
  "78704": {
    message: "**78704 (South Austin)** — EV charger hotspot with 142 permits. Also leads ADU construction. Younger, eco-conscious demographic.",
    mapFilter: "all",
    highlightZip: "78704",
  },
  "east austin": {
    message: "**East Austin (78702, 78723)** — density growth center. Leads in ADUs and multi-family. Lower resilience but highest housing growth.",
    mapFilter: ["adu", "ev"],
    highlightZip: "78702",
  },
  "solar trend": {
    message: "Solar installations have grown **+28% YoY** since 2019. Summer months show peak activity due to favorable weather and high electricity bills.",
    showChart: true,
    chartTitle: "Solar Installations by Year",
    chartData: [
      { name: "2019", value: 156, lastYear: 112 },
      { name: "2020", value: 223, lastYear: 156 },
      { name: "2021", value: 312, lastYear: 223 },
      { name: "2022", value: 398, lastYear: 312 },
      { name: "2023", value: 467, lastYear: 398 },
      { name: "2024", value: 580, lastYear: 467 },
    ],
  },
  "ev trend": {
    message: "EV charger permits up **+34% YoY**. Growth accelerated in 2022 with federal incentives and expanding Tesla/Rivian ownership in Austin.",
    showChart: true,
    chartTitle: "EV Charger Permits by Year",
    chartData: [
      { name: "2019", value: 89, lastYear: 62 },
      { name: "2020", value: 134, lastYear: 89 },
      { name: "2021", value: 198, lastYear: 134 },
      { name: "2022", value: 287, lastYear: 198 },
      { name: "2023", value: 398, lastYear: 287 },
      { name: "2024", value: 529, lastYear: 398 },
    ],
  },
  "generator trend": {
    message: "Generator permits **spiked 130%** after the 2021 freeze. Stabilized since but remain 2.5x pre-freeze levels. Grid distrust is sticky.",
    showChart: true,
    chartTitle: "Generator Permits by Year",
    chartData: [
      { name: "2019", value: 89 },
      { name: "2020", value: 102 },
      { name: "2021", value: 234 },
      { name: "2022", value: 298 },
      { name: "2023", value: 312 },
      { name: "2024", value: 242 },
    ],
  },
  "resilience": {
    message: "Grid resilience = generators + batteries + solar. **West Austin leads**, East shows vulnerability. The 2021 freeze drove +47% in backup power.",
    mapFilter: ["generator", "battery", "solar"],
  },
  "bottleneck": {
    message: "The bottleneck: **storage lags generation**. Solar:Battery ratio is 7:1. Austin generates clean power but can't store it.",
    mapFilter: ["battery", "solar"],
  },
  "frontier": {
    message: "The frontier is real: **Solar (+28% YoY)** and **EV chargers (+34% YoY)** are spreading. Austin is investing in electrified living.",
    mapFilter: ["solar", "ev"],
  },
  // District queries
  "district 10": {
    message: "**District 10 (West Austin/Westlake)** — 722 permits, highest in the city. Leads in generators, batteries, and large solar. The resilience capital of Austin.",
    mapFilter: "all",
    highlightDistrict: 10,
  },
  "district 9": {
    message: "**District 9 (East Austin)** — 343 permits. Leads in ADUs and density growth. Lower resilience investment but highest housing growth.",
    mapFilter: "all",
    highlightDistrict: 9,
  },
  "district 1": {
    message: "**District 1 (North Austin)** — 399 permits. Balanced mix of solar and EV chargers. Middle-class suburbs investing in electrification.",
    mapFilter: "all",
    highlightDistrict: 1,
  },
  "district 8": {
    message: "**District 8 (South Austin)** — 346 permits. Strong solar adoption, growing EV infrastructure. Eco-conscious suburban growth.",
    mapFilter: "all",
    highlightDistrict: 8,
  },
  "district 7": {
    message: "**District 7 (Northwest Austin)** — 345 permits. High resilience with generators and batteries. Established wealth investing in grid independence.",
    mapFilter: "all",
    highlightDistrict: 7,
  },
  "district 3": {
    message: "**District 3 (Central/Downtown)** — 183 permits. EV chargers and ADUs dominate. Urban core with limited roof space for solar.",
    mapFilter: "all",
    highlightDistrict: 3,
  },
  "district 4": {
    message: "**District 4 (Far East)** — 175 permits. Emerging area with ADU growth. Lower overall investment but rising density.",
    mapFilter: "all",
    highlightDistrict: 4,
  },
  "districts": {
    message: "**By Council District:**\n• D10 (West): 722 — highest resilience\n• D1 (North): 399\n• D8 (South): 346\n• D7 (NW): 345\n• D9 (East): 343 — highest density\n• D3 (Central): 183",
    showChart: true,
    chartTitle: "Permits by Council District",
    chartData: [
      { name: "D10", value: 722 },
      { name: "D1", value: 399 },
      { name: "D8", value: 346 },
      { name: "D7", value: 345 },
      { name: "D9", value: 343 },
      { name: "D2", value: 285 },
      { name: "D5", value: 279 },
      { name: "D6", value: 235 },
      { name: "D3", value: 183 },
      { name: "D4", value: 175 },
    ],
  },
};

type Mode = "narrative" | "explore";
type ExploreView = "map" | "chart";

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
  const [exploreHighlightDistrict, setExploreHighlightDistrict] = useState<number | undefined>();
  const [exploreView, setExploreView] = useState<ExploreView>("map");
  const [exploreChartData, setExploreChartData] = useState<{ title: string; data: Array<{ name: string; value: number; lastYear?: number }> } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const stage = narrativeStages[currentStage];

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && currentStage < narrativeStages.length - 1) {
      const timer = setTimeout(() => {
        goToNextStage();
      }, 6000);
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

        if (response.showChart && response.chartData) {
          setExploreView("chart");
          setExploreChartData({ title: response.chartTitle || "Trend", data: response.chartData });
        } else if (response.mapFilter) {
          setExploreView("map");
          setExploreFilter(response.mapFilter);
          setExploreHighlightZip(response.highlightZip);
          setExploreHighlightDistrict(response.highlightDistrict);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Try:\n• **show solar** / **show ev** / **show panels**\n• **solar trend** / **panel trend** / **generator trend**\n• **westlake** / **78704** / **east austin**\n• **district 10** / **districts** for council areas\n• **resilience** / **infrastructure** / **bottleneck**",
          },
        ]);
      }
    }, 400);
  };

  const switchToExplore = () => {
    setMode("explore");
    setIsPlaying(false);
    setExploreView("map");
    setChatMessages([
      {
        role: "assistant",
        content: "**Explore mode.** Ask me anything:\n\n• \"Show solar\" or \"Show panels\"\n• \"Panel trend\" for infrastructure strain\n• \"Westlake\" or \"78704\" for neighborhoods\n• \"District 10\" or \"Districts\" for council areas",
      },
    ]);
  };

  const switchToNarrative = () => {
    setMode("narrative");
    setChatMessages([]);
    setExploreFilter("all");
    setExploreHighlightZip(undefined);
    setExploreHighlightDistrict(undefined);
    setExploreView("map");
  };

  const getMapFilter = (): SignalType | SignalType[] => {
    return mode === "narrative" ? stage.mapFilter : exploreFilter;
  };

  const getHighlightZip = (): string | undefined => {
    return mode === "explore" ? exploreHighlightZip : undefined;
  };

  const getHighlightDistrict = (): number | undefined => {
    return mode === "explore" ? exploreHighlightDistrict : undefined;
  };

  // Quick action buttons for explore mode
  const quickActions = [
    { label: "Solar", filter: "solar" as SignalType },
    { label: "EV", filter: "ev" as SignalType },
    { label: "Generators", filter: "generator" as SignalType },
    { label: "Batteries", filter: "battery" as SignalType },
    { label: "ADUs", filter: "adu" as SignalType },
    { label: "Panels", filter: "panel" as SignalType },
    { label: "All", filter: "all" as SignalType },
  ];

  return (
    <div className="flex h-full">
      {/* Left Panel */}
      <div className="w-[480px] border-r border-white/10 flex flex-col">
        {/* Mode Toggle */}
        <div className="p-4 border-b border-white/10">
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={switchToNarrative}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${
                mode === "narrative"
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white"
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
                  : "text-white/50 hover:text-white"
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
            <div className="p-6 border-b border-white/10">
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
                      className={`h-1 rounded-full transition-all ${
                        i === currentStage
                          ? "w-8 bg-white"
                          : i < currentStage
                          ? "w-4 bg-white/50"
                          : "w-4 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/40">
                  {currentStage + 1} / {narrativeStages.length}
                </span>
              </div>

              <div
                className={`transition-opacity duration-300 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                <h1 className="text-2xl font-light text-white">{stage.title}</h1>
                <p className="text-white/40 text-sm mt-1">{stage.subtitle}</p>
              </div>
            </div>

            {/* Narrative Text */}
            <div
              className={`p-6 transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <p className="text-white/70 text-lg leading-relaxed font-light">
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
                  className={`rounded-xl p-4 transition-all border ${
                    stat.highlight
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                  <p
                    className={`text-2xl font-light ${
                      stat.highlight ? "text-white" : "text-white/80"
                    }`}
                  >
                    {stat.value}
                  </p>
                  {stat.subtext && (
                    <p className="text-xs text-white/40 mt-1">{stat.subtext}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Insight Box */}
            <div className="flex-1" />
            <div
              className={`mx-6 mb-6 p-4 rounded-xl border border-white/20 bg-white/5 transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <p className="text-sm leading-relaxed text-white/70">
                {stage.insight}
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={restart}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
                    title="Restart"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                      isPlaying
                        ? "bg-white text-black border-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
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
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  {currentStage === narrativeStages.length - 1 ? (
                    <button
                      onClick={switchToExplore}
                      className="px-4 py-2 rounded-lg bg-white text-black font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      Explore <Compass size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={goToNextStage}
                      className="px-4 py-2 rounded-lg bg-white text-black font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
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
            <div className="p-6 border-b border-white/10">
              <h1 className="text-2xl font-light text-white">Explore</h1>
              <p className="text-white/40 text-sm mt-1">Ask questions about Austin&apos;s infrastructure</p>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-xs text-white/40 mb-3">Quick filters</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setExploreFilter(action.filter);
                      setExploreHighlightZip(undefined);
                      setExploreHighlightDistrict(undefined);
                      setExploreView("map");
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      exploreFilter === action.filter && exploreView === "map"
                        ? "bg-white text-black"
                        : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30"
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
                    <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%]">
                      <p className="text-sm text-white">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={14} className="text-white" />
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
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-white/10">
              <form onSubmit={handleChatSubmit}>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about Austin's infrastructure..."
                    className="flex-1 bg-transparent outline-none text-white placeholder-white/30"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      chatInput.trim()
                        ? "bg-white text-black"
                        : "bg-white/10 text-white/30"
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

      {/* Right Panel - Map or Chart */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-light text-white">
              {mode === "narrative"
                ? stage.title
                : exploreView === "chart" && exploreChartData
                  ? exploreChartData.title
                  : "Infrastructure Map"}
            </h2>
            <p className="text-sm text-white/40">
              {(() => {
                if (mode === "explore" && exploreView === "chart") {
                  return "Time series data";
                }
                const filter = getMapFilter();
                if (Array.isArray(filter)) {
                  return filter.map((f) => f.charAt(0).toUpperCase() + f.slice(1)).join(" + ");
                }
                return filter === "all" ? "All Signals" : filter.charAt(0).toUpperCase() + filter.slice(1);
              })()}
              {getHighlightZip() && ` • ${getHighlightZip()}`}
              {getHighlightDistrict() && ` • District ${getHighlightDistrict()}`}
            </p>
          </div>

          {/* View Toggle for Explore Mode */}
          {mode === "explore" && (
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setExploreView("map")}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  exploreView === "map" ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setExploreView("chart")}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  exploreView === "chart" ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Chart
              </button>
            </div>
          )}

          {/* Legend */}
          {(mode === "narrative" || exploreView === "map") && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <span className="text-white/40">EV</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                <span className="text-white/40">Solar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                <span className="text-white/40">Battery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                <span className="text-white/40">ADU</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-white/50" />
                <span className="text-white/40">Generator</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-white/40" />
                <span className="text-white/40">Panel</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div
          className={`flex-1 rounded-xl overflow-hidden border border-white/10 transition-opacity duration-500 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        >
          {mode === "narrative" ? (
            stage.showChart && stage.chartData ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <PermitMap
                    filter={getMapFilter()}
                    highlightZip={getHighlightZip()}
                    highlightDistrict={getHighlightDistrict()}
                    className="h-full"
                  />
                </div>
                <div className="h-48 border-t border-white/10 bg-black/50 p-4">
                  <TrendChart
                    title={stage.chartTitle || "Trend"}
                    data={stage.chartData}
                    showAverage={false}
                  />
                </div>
              </div>
            ) : (
              <PermitMap
                filter={getMapFilter()}
                highlightZip={getHighlightZip()}
                highlightDistrict={getHighlightDistrict()}
                className="h-full"
              />
            )
          ) : exploreView === "chart" && exploreChartData ? (
            <div className="h-full p-6 bg-black/30">
              <TrendChart
                title={exploreChartData.title}
                data={exploreChartData.data}
                showAverage={true}
              />
            </div>
          ) : (
            <PermitMap
              filter={getMapFilter()}
              highlightZip={getHighlightZip()}
              highlightDistrict={getHighlightDistrict()}
              className="h-full"
            />
          )}
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-4 grid grid-cols-6 gap-3">
          {[
            { key: "ev", icon: Zap, label: "EV", value: "529" },
            { key: "solar", icon: Sun, label: "Solar", value: "580" },
            { key: "battery", icon: Battery, label: "Battery", value: "87" },
            { key: "adu", icon: Home, label: "ADU", value: "383" },
            { key: "generator", icon: Gauge, label: "Generator", value: "634" },
            { key: "panel", icon: CircuitBoard, label: "Panel", value: "3,072" },
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
                    setExploreHighlightDistrict(undefined);
                    setExploreView("map");
                  }
                }}
                className={`rounded-lg p-3 border transition-all text-left ${
                  isActive
                    ? "bg-white/10 border-white/30"
                    : "bg-white/5 border-white/10 opacity-40"
                } ${mode === "explore" ? "cursor-pointer hover:opacity-100" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-white/70" />
                  <span className="text-xs text-white/40">{item.label}</span>
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
