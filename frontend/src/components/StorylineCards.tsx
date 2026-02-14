"use client";

import { useState } from "react";
import { Zap, Sun, Building2, ArrowRight } from "lucide-react";

export interface Storyline {
  id: string;
  title: string;
  tagline: string;
  questions: string[];
  icon: "resilience" | "solar" | "remodel";
  color: "amber" | "blue" | "purple";
  premise: string;
}

export const STORYLINES: Storyline[] = [
  {
    id: "resilience",
    title: "The Resilience Divide",
    tagline: "Who stays powered when the grid fails?",
    premise: "We're investigating whether backup power follows wealth lines in Austin.",
    icon: "resilience",
    color: "amber",
    questions: [
      "How did generator permits spike after the 2021 freeze?",
      "Why does Westlake have 5x more generators than East Austin?",
      "Which districts are most prepared for grid failure?",
      "How did Winter Storm Uri change Austin's infrastructure?",
      "What's the backup power divide in Austin?",
      "How does income correlate with energy infrastructure?",
    ],
  },
  {
    id: "solar",
    title: "The Solar Boom, Battery Lag",
    tagline: "Where did solar surge—and storage stall?",
    premise: "We're tracking the gap between solar adoption and battery storage across Austin.",
    icon: "solar",
    color: "blue",
    questions: [
      "How has solar adoption grown since 2000?",
      "How did solar installations in 2024 compare to the 2023 peak?",
      "Why is there only 1 battery for every 9 solar installs?",
      "Which neighborhoods lead in battery storage?",
      "How much total solar capacity has Austin installed?",
      "Where are the solar deserts in Austin?",
    ],
  },
  {
    id: "remodel",
    title: "The Remodel Economy",
    tagline: "Where is money concentrating?",
    premise: "We're mapping where renovation dollars flow—and where they don't.",
    icon: "remodel",
    color: "purple",
    questions: [
      "Why has demolition grown 547% in Austin?",
      "How have ADU permits grown since zoning changes?",
      "Where are pool permits concentrated in Austin?",
      "Did luxury construction bounce back after the 2020 COVID dip?",
      "Which areas are seeing the most teardowns?",
      "Which ZIPs have the most high-value renovations?",
    ],
  },
];

const ICONS = {
  resilience: Zap,
  solar: Sun,
  remodel: Building2,
};

const COLORS = {
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-400/50",
    icon: "text-amber-400",
    glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/30 hover:border-blue-400/50",
    icon: "text-blue-400",
    glow: "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/30 hover:border-purple-400/50",
    icon: "text-purple-400",
    glow: "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  },
};

interface StorylineCardsProps {
  onSelectStoryline: (storyline: Storyline) => void;
  isLoading: boolean;
}

export function StorylineCards({ onSelectStoryline, isLoading }: StorylineCardsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center px-4">
      {/* Headline */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extralight text-white mb-3 tracking-tight">
          Austin's Past, Present & Future
        </h1>
        <p className="text-white/50 text-lg mb-6">
          A story told through 2.34 million building permits
        </p>
        <p className="text-white/30 text-sm max-w-md mx-auto">
          Pick a storyline to investigate
        </p>
      </div>

      {/* Storyline cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {STORYLINES.map((storyline) => {
          const Icon = ICONS[storyline.icon];
          const colors = COLORS[storyline.color];
          const isHovered = hoveredId === storyline.id;

          return (
            <button
              key={storyline.id}
              onClick={() => onSelectStoryline(storyline)}
              onMouseEnter={() => setHoveredId(storyline.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={isLoading}
              className={`
                group relative text-left p-6 rounded-2xl
                bg-gradient-to-br ${colors.bg}
                border ${colors.border}
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:-translate-y-1
                ${colors.glow}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-white/5 mb-4 ${colors.icon}`}>
                <Icon size={24} />
              </div>

              {/* Title */}
              <h2 className="text-xl font-medium text-white mb-2">
                {storyline.title}
              </h2>

              {/* Tagline */}
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                {storyline.tagline}
              </p>

              {/* Preview questions */}
              <div className="space-y-1.5 mb-4">
                {storyline.questions.slice(0, 3).map((q, i) => (
                  <p key={i} className="text-xs text-white/40 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    {q}
                  </p>
                ))}
              </div>

              {/* CTA */}
              <div className={`
                flex items-center gap-2 text-sm font-medium
                ${colors.icon} opacity-60 group-hover:opacity-100
                transition-all duration-300
              `}>
                <span>Start investigating</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-lg">Starting investigation...</span>
          </div>
        </div>
      )}
    </div>
  );
}
