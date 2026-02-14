"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Zap, Database, Brain, Map, Users, ArrowRight } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "hook", label: "The Question" },
  { id: "problem", label: "The Data" },
  { id: "solution", label: "The Extraction" },
  { id: "preview", label: "The Insight" },
  { id: "audience", label: "For You" },
];

// Sample permit text for the demo
const SAMPLE_PERMIT = `INSTALL 8.5KW ROOFTOP SOLAR PV SYSTEM WITH
TESLA POWERWALL 2 BATTERY BACKUP. INCLUDES
200A PANEL UPGRADE AND EV CHARGER PREP.`;

const EXTRACTED_SIGNALS = [
  { key: "is_solar", value: "true", color: "text-amber-400" },
  { key: "solar_kw", value: "8.5", color: "text-amber-400" },
  { key: "has_battery", value: "true", color: "text-emerald-400" },
  { key: "is_panel_upgrade", value: "true", color: "text-blue-400" },
  { key: "is_ev_prep", value: "true", color: "text-purple-400" },
];

// Rolling questions for the hook - cycles through personas
const ROLLING_QUESTIONS = [
  { question: "Where is the grid failing?", color: "text-red-400", persona: "Utilities" },
  { question: "Where should we build next?", color: "text-blue-400", persona: "Developers" },
  { question: "Where are the coverage gaps?", color: "text-amber-400", persona: "Solar Companies" },
  { question: "Where is investment needed?", color: "text-emerald-400", persona: "City Planners" },
  { question: "Where is load growing fastest?", color: "text-purple-400", persona: "Grid Operators" },
];

const AUDIENCES = [
  {
    icon: "🏛️",
    title: "City Planners",
    description: "Find where grid infrastructure investment is needed most",
    revealed: "District 1 has 12x fewer backup systems than District 10",
  },
  {
    icon: "🔌",
    title: "Utilities",
    description: "Forecast load growth by neighborhood before it hits",
    revealed: "78660 added 8,234 new connections in 3 years",
  },
  {
    icon: "☀️",
    title: "Solar Companies",
    description: "Find gaps in coverage—where to sell next",
    revealed: "Only 1 battery for every 9 solar installs",
  },
  {
    icon: "🏗️",
    title: "Developers",
    description: "Identify infrastructure-ready zones for new projects",
    revealed: "Central Austin: 89% remodels. Outer ZIPs: 67% new builds",
  },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [revealedAudiences, setRevealedAudiences] = useState<Set<number>>(new Set());
  const [extractionPhase, setExtractionPhase] = useState(0);
  const [rollingIndex, setRollingIndex] = useState(0);

  // Cycle through rolling questions on the hook step
  useEffect(() => {
    if (currentStep === 0) {
      const interval = setInterval(() => {
        setRollingIndex((prev) => (prev + 1) % ROLLING_QUESTIONS.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Reset extraction animation for solution step
      if (currentStep === 1) {
        setExtractionPhase(0);
        // Animate through extraction phases
        setTimeout(() => setExtractionPhase(1), 500);
        setTimeout(() => setExtractionPhase(2), 1200);
        setTimeout(() => setExtractionPhase(3), 2000);
      }
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAudience = (index: number) => {
    setRevealedAudiences((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "hook":
        const currentQuestion = ROLLING_QUESTIONS[rollingIndex];
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-white/40 text-sm uppercase tracking-widest mb-6">Austin, Texas</p>
            <h1 className="text-5xl md:text-7xl font-extralight text-white mb-4">
              2.2 Million Permits
            </h1>
            <p className="text-2xl md:text-3xl font-light text-white/60 mb-8">
              One question buried inside.
            </p>
            <div className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent mb-6" />

            {/* Rolling question */}
            <div className="h-20 flex flex-col items-center justify-center">
              <p
                key={rollingIndex}
                className={`text-2xl md:text-3xl font-light ${currentQuestion.color} animate-fade-in`}
              >
                {currentQuestion.question}
              </p>
              <p className="text-white/30 text-sm mt-2 uppercase tracking-widest">
                — {currentQuestion.persona}
              </p>
            </div>

            {/* Progress dots for rolling */}
            <div className="flex gap-2 mt-6">
              {ROLLING_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === rollingIndex ? "bg-white w-4" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        );

      case "problem":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="flex items-center gap-2 mb-8">
              <Database size={20} className="text-white/40" />
              <p className="text-white/40 text-sm uppercase tracking-widest">The Challenge</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-8">
              Insights trapped in <span className="text-amber-400">unstructured text</span>
            </h2>

            {/* Raw permit example */}
            <div className="max-w-2xl w-full">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Raw permit description</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 font-mono text-sm text-white/70 leading-relaxed">
                {SAMPLE_PERMIT}
              </div>
              <p className="text-white/30 text-sm mt-4 text-center">
                × 2,200,000 more like this
              </p>
            </div>

            <div className="mt-8 text-center">
              <p className="text-white/50">
                What's a <span className="text-amber-400">solar install</span>?
                What's a <span className="text-emerald-400">battery</span>?
                <br />
                What's an <span className="text-purple-400">EV charger</span>?
                What's a <span className="text-blue-400">generator</span>?
              </p>
            </div>
          </div>
        );

      case "solution":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="flex items-center gap-2 mb-8">
              <Brain size={20} className="text-white/40" />
              <p className="text-white/40 text-sm uppercase tracking-widest">The Solution</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-12">
              LLM extraction at <span className="text-amber-400">GPU scale</span>
            </h2>

            {/* Extraction pipeline visualization */}
            <div className="max-w-4xl w-full grid md:grid-cols-3 gap-4 items-center">
              {/* Input */}
              <div className={`transition-all duration-500 ${extractionPhase >= 1 ? "opacity-100" : "opacity-40"}`}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 text-center">Raw Text</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs text-white/50 h-32 overflow-hidden">
                  {SAMPLE_PERMIT.slice(0, 80)}...
                </div>
              </div>

              {/* Arrow + Model */}
              <div className="flex flex-col items-center justify-center">
                <div className={`transition-all duration-500 ${extractionPhase >= 2 ? "opacity-100 scale-100" : "opacity-30 scale-90"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
                    <Zap size={24} className="text-amber-400" />
                    <div className="w-8 h-px bg-gradient-to-r from-amber-400/50 to-transparent" />
                  </div>
                  <p className="text-white/60 text-xs text-center">8B Model</p>
                  <p className="text-white/30 text-xs text-center">vLLM on DGX</p>
                </div>
              </div>

              {/* Output */}
              <div className={`transition-all duration-500 ${extractionPhase >= 3 ? "opacity-100" : "opacity-40"}`}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 text-center">Structured Signal</p>
                <div className="bg-white/5 border border-white/20 rounded-xl p-4 font-mono text-xs">
                  {"{"}
                  {EXTRACTED_SIGNALS.map((signal, i) => (
                    <div key={signal.key} className={`ml-2 ${signal.color}`}>
                      "{signal.key}": {signal.value}{i < EXTRACTED_SIGNALS.length - 1 ? "," : ""}
                    </div>
                  ))}
                  {"}"}
                </div>
              </div>
            </div>

            <p className="text-white/40 text-sm mt-8 text-center">
              150K candidate permits → Batched inference → Queryable signals
            </p>
          </div>
        );

      case "preview":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="flex items-center gap-2 mb-8">
              <Map size={20} className="text-white/40" />
              <p className="text-white/40 text-sm uppercase tracking-widest">The Result</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-12">
              Stories emerge from <span className="text-amber-400">structured data</span>
            </h2>

            {/* Synthetic preview cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
              {/* Map preview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Geographic Signal</p>
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* Fake map grid */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute border-l border-white/10" style={{ left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0 }} />
                    ))}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="absolute border-t border-white/10" style={{ top: `${(i + 1) * 16.6}%`, left: 0, right: 0 }} />
                    ))}
                  </div>
                  {/* Fake hotspots */}
                  <div className="absolute w-8 h-8 bg-amber-500/30 rounded-full blur-md" style={{ top: '30%', left: '60%' }} />
                  <div className="absolute w-12 h-12 bg-red-500/20 rounded-full blur-md" style={{ top: '50%', left: '30%' }} />
                  <div className="absolute w-6 h-6 bg-emerald-500/30 rounded-full blur-md" style={{ top: '65%', left: '70%' }} />
                  <span className="text-white/30 text-sm z-10">Austin Districts</span>
                </div>
                <p className="text-white/60 text-sm mt-3">Generator density by council district</p>
              </div>

              {/* Chart preview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Trend Signal</p>
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-end justify-around p-4 gap-2">
                  {/* Fake bar chart */}
                  {[35, 42, 38, 95, 120, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`w-8 rounded-t transition-all ${i >= 3 ? "bg-amber-500/60" : "bg-white/20"}`}
                      style={{ height: `${h * 0.6}%` }}
                    />
                  ))}
                </div>
                <p className="text-white/60 text-sm mt-3">Generator permits spike post-2021 freeze</p>
              </div>
            </div>

            <p className="text-white/40 text-sm mt-8 text-center max-w-lg">
              Maps, charts, and insights—all derived from permit text that was previously unsearchable.
            </p>
          </div>
        );

      case "audience":
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="flex items-center gap-2 mb-8">
              <Users size={20} className="text-white/40" />
              <p className="text-white/40 text-sm uppercase tracking-widest">Who Uses This</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white text-center mb-4">
              Built for <span className="text-amber-400">decision makers</span>
            </h2>
            <p className="text-white/40 text-sm mb-12">Click to reveal what they discover</p>

            {/* Audience cards */}
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
              {AUDIENCES.map((audience, i) => {
                const isRevealed = revealedAudiences.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleAudience(i)}
                    className={`text-left p-5 rounded-2xl border transition-all ${
                      isRevealed
                        ? "bg-white/10 border-white/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{audience.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{audience.title}</h3>
                        <p className="text-white/50 text-sm">{audience.description}</p>
                        {isRevealed && (
                          <p className="text-amber-400 text-sm mt-3 pt-3 border-t border-white/10">
                            → {audience.revealed}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress dots */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentStep
                ? "bg-white w-6"
                : i < currentStep
                ? "bg-white/60"
                : "bg-white/20"
            }`}
            title={step.label}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="fixed top-6 right-6 text-white/30 hover:text-white/60 text-sm transition-colors z-50"
      >
        Skip intro
      </button>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center">
        {renderStep()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep === 0
              ? "opacity-0 pointer-events-none"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all"
        >
          {currentStep === STEPS.length - 1 ? (
            <>
              <span>Start Exploring</span>
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              <span>Continue</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </nav>
    </div>
  );
}
