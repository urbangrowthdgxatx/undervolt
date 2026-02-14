"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, ChevronDown, ArrowRight } from "lucide-react";
import type { SignalType } from "@/components/LeafletMap";
import dynamicImport from "next/dynamic";

const LeafletMap = dynamicImport(
  () => import("@/components/LeafletMap").then((mod) => ({ default: mod.LeafletMap })),
  { ssr: false, loading: () => null }
);

const stories = [
  {
    id: "intro",
    title: "Austin's Grid",
    subtitle: "2.34 million permits tell a story",
    stat: null,
    statLabel: null,
    color: "white",
    filter: null,
    description: "Every point on this map is a construction permit. Together, they reveal how Austin is preparing—or failing to prepare—for the next grid crisis."
  },
  {
    id: "solar",
    title: "The Solar Boom",
    subtitle: "Clean energy adoption",
    stat: "26,075",
    statLabel: "solar installations",
    color: "amber",
    filter: "solar",
    description: "Austin has embraced rooftop solar. But generation without storage is a house of cards."
  },
  {
    id: "battery",
    title: "The Battery Desert",
    subtitle: "Where the power disappears",
    stat: "2,874",
    statLabel: "battery systems",
    color: "blue",
    filter: "battery",
    description: "For every 9 solar installs, there's just 1 battery. When the sun sets—or the grid fails—that energy vanishes."
  },
  {
    id: "generator",
    title: "Trust, Broken",
    subtitle: "After the 2021 freeze",
    stat: "+340%",
    statLabel: "generator permits",
    color: "red",
    filter: "generator",
    description: "Generator permits surged after Winter Storm Uri. Homeowners aren't waiting for the grid to save them."
  },
  {
    id: "ev",
    title: "Electric Future",
    subtitle: "Infrastructure racing to keep up",
    stat: "3,714",
    statLabel: "EV chargers",
    color: "green",
    filter: "ev",
    description: "Electric vehicles are coming. Is the grid ready for millions of new loads?"
  }
];

// Map energy_type from API to SignalType
const energyTypeToSignal: Record<string, SignalType> = {
  solar: "solar",
  battery: "battery",
  generator: "generator",
  ev_charger: "ev",
  panel_upgrade: "panel",
};

// Map cluster IDs to default signal types
const clusterToSignal: Record<number, SignalType> = {
  0: "panel",
  1: "generator",
  2: "solar",
  4: "battery",
  6: "adu",
  7: "ev",
};

// Transform GeoJSON feature to PermitLocation
function transformFeature(feature: any, index: number) {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [0, 0];
  
  let signal: SignalType = "all";
  if (props.energy_type && energyTypeToSignal[props.energy_type]) {
    signal = energyTypeToSignal[props.energy_type];
  } else if (props.cluster_id !== null && props.cluster_id !== undefined) {
    signal = clusterToSignal[props.cluster_id] || "all";
  }

  // Prefer energy type label over ML cluster name when available
  const energyLabels: Record<string, string> = {
    solar: "Solar Installation",
    battery: "Battery Storage",
    generator: "Generator",
    ev_charger: "EV Charger",
    panel_upgrade: "Panel Upgrade",
    hvac: "HVAC",
  };
  const description = (props.energy_type && energyLabels[props.energy_type])
    ? energyLabels[props.energy_type]
    : (props.cluster_name || "Permit");

  return {
    id: props.id?.toString() || props.permit_number || `permit-${index}`,
    lat: coords[1],
    lng: coords[0],
    signal,
    description,
    zip: props.zip_code || "",
    cluster: props.cluster_id ?? 0,
  };
}

export default function ExplorePage() {
  const [activeStory, setActiveStory] = useState(0);
  const [permits, setPermits] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [selectedEnergyType, setSelectedEnergyType] = useState<SignalType>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  // Progressive data loading
  useEffect(() => {
    let cancelled = false;
    
    async function loadData() {
      try {
        const res = await fetch("/api/geojson");
        const data = await res.json();
        const features = data.features || [];
        
        if (cancelled) return;
        
        // Load in batches for progressive rendering
        const BATCH_SIZE = 5000;
        const batches = Math.ceil(features.length / BATCH_SIZE);
        
        for (let i = 0; i < batches && !cancelled; i++) {
          const start = i * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, features.length);
          const batch = features.slice(start, end);
          
          const transformed = batch
            .map((f: any, idx: number) => transformFeature(f, start + idx))
            .filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);
          
          setPermits(prev => [...prev, ...transformed]);
          setLoadProgress(Math.round((end / features.length) * 100));
          
          // Small delay between batches to allow UI to breathe
          if (i < batches - 1) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
        
        setLoadingData(false);
      } catch (err) {
        console.error("Failed to load permits:", err);
        setLoadingData(false);
      }
    }
    
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSelectedEnergyType((stories[activeStory].filter as SignalType) || "all");
  }, [activeStory]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const sectionHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / sectionHeight);
    if (newIndex !== activeStory && newIndex >= 0 && newIndex < stories.length) {
      setActiveStory(newIndex);
    }
  }, [activeStory]);

  const colorClasses: Record<string, string> = {
    white: "text-white",
    amber: "text-amber-400",
    blue: "text-blue-400",
    red: "text-red-400",
    green: "text-emerald-400"
  };

  const dotColors: Record<string, string> = {
    white: "bg-white",
    amber: "bg-amber-400",
    blue: "bg-blue-400",
    red: "bg-red-400",
    green: "bg-emerald-400"
  };

  return (
    <div className="h-screen bg-black overflow-hidden">
      {/* Fixed Map Background - renders immediately */}
      <div className="fixed inset-0 z-0">
        <LeafletMap
          individualPermits={permits}
          filter={selectedEnergyType}
          simpleMode={true}
          loading={loadingData}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70 pointer-events-none" />
        
        {/* Loading progress indicator */}
        {loadingData && (
          <div className="absolute bottom-4 left-4 z-50 bg-black/80 backdrop-blur px-4 py-2 rounded-full flex items-center gap-3">
            <div className="w-4 h-4 relative">
              <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-amber-500 rounded-full animate-spin" />
            </div>
            <span className="text-white/60 text-sm">
              Loading permits... {loadProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {stories.map((story, idx) => (
          <button
            key={story.id}
            onClick={() => {
              setActiveStory(idx);
              containerRef.current?.scrollTo({ top: idx * window.innerHeight, behavior: "smooth" });
            }}
            className={`rounded-full transition-all ${
              idx === activeStory
                ? `w-3 h-3 ${dotColors[story.color]}`
                : "w-2 h-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Story Sections - render immediately */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 h-screen overflow-y-auto snap-y snap-mandatory"
      >
        {stories.map((story, idx) => (
          <section
            key={story.id}
            className="h-screen snap-start flex items-center justify-center px-8"
          >
            <div className="max-w-2xl text-center">
              <p className={`text-sm tracking-[0.3em] uppercase mb-4 ${colorClasses[story.color]} opacity-60`}>
                {story.subtitle}
              </p>

              <h1 className={`text-5xl md:text-7xl font-bold mb-6 ${colorClasses[story.color]}`}>
                {story.title}
              </h1>

              {story.stat && (
                <div className="mb-8">
                  <p className={`text-6xl md:text-8xl font-black ${colorClasses[story.color]}`}>
                    {story.stat}
                  </p>
                  <p className="text-white/40 text-lg mt-2">{story.statLabel}</p>
                </div>
              )}

              <p className="text-xl text-white/60 leading-relaxed max-w-xl mx-auto">
                {story.description}
              </p>

              {idx === 0 && (
                <div className="mt-12 animate-bounce">
                  <ChevronDown className="w-8 h-8 text-white/40 mx-auto" />
                </div>
              )}

              {idx === stories.length - 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
                  >
                    Explore the Map
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="/story"
                    className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-medium hover:bg-white/20 transition-colors"
                  >
                    Ask Questions
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
