"use client";

import Link from "next/link";
import { BookOpen, Map, Zap, Database, Brain, Sparkles, Activity, AlertTriangle, BarChart3, Globe, MessageSquare, Layers, GitBranch, Cpu, ArrowRight } from "lucide-react";

const FLOW_STAGES = [
  {
    label: "DATA",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    items: [
      { icon: Database, name: "Austin Open Data", detail: "2.34M permits" },
      { icon: Zap, name: "GPU Cleaning", detail: "cuDF on Jetson" },
    ],
  },
  {
    label: "ML",
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400",
    items: [
      { icon: Brain, name: "NLP Features", detail: "80 binary cols" },
      { icon: Layers, name: "PCA", detail: "80 \u2192 10 dims" },
      { icon: GitBranch, name: "KMeans", detail: "k=8 clusters" },
    ],
  },
  {
    label: "SERVE",
    color: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    textColor: "text-green-400",
    items: [
      { icon: Globe, name: "Supabase", detail: "Postgres + API" },
      { icon: MessageSquare, name: "Llama 3.2", detail: "On-device LLM" },
      { icon: Map, name: "Next.js", detail: "Map + Stories" },
    ],
  },
];

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 story-bg">
      <div className="max-w-5xl w-full pt-16 pb-12">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-7xl font-bold text-white tracking-tight">Undervolt</h1>
          </div>
          <p className="text-3xl text-white/60 mt-5 font-light tracking-wide">
            Urban Growth Intelligence for Austin
          </p>
          <p className="text-lg text-white/35 mt-4 max-w-2xl mx-auto leading-relaxed">
            GPU-accelerated analytics and on-device LLM extract hidden infrastructure signals from <span className="text-white/70 font-medium">2.3 million construction permits</span>
          </p>
        </div>

        {/* The Hook - Key Finding */}
        <div className="mb-12 bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold text-lg mb-2">The Resilience Gap</h3>
              <p className="text-white/60 leading-relaxed">
                For every <span className="text-amber-400 font-semibold">22 solar panels</span> installed in Austin, there is only <span className="text-amber-400 font-semibold">1 battery</span>. The city produces clean energy but can&apos;t store it. After the 2021 freeze, wealthy District 10 added <span className="text-white font-medium">2,151 generators</span>. East Austin added <span className="text-white font-medium">175</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">2.3M</div>
            <div className="text-xs text-white/40 mt-1">Permits Analyzed</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">25,982</div>
            <div className="text-xs text-white/40 mt-1">Solar Installations</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">7,248</div>
            <div className="text-xs text-white/40 mt-1">Generators</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">1,161</div>
            <div className="text-xs text-white/40 mt-1">Battery Systems</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">3,642</div>
            <div className="text-xs text-white/40 mt-1">EV Chargers</div>
          </div>
        </div>

        {/* End-to-End Pipeline Visual */}
        <div className="mb-12">
          <div className="text-sm text-white/30 uppercase tracking-wider mb-5 text-center">End-to-End Pipeline</div>

          {/* Horizontal flow on desktop, vertical on mobile */}
          <div className="hidden md:flex items-stretch gap-3">
            {FLOW_STAGES.map((stage, si) => (
              <div key={si} className="flex items-stretch gap-3 flex-1">
                <div className={`flex-1 rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-5`}>
                  <div className={`text-xs font-bold tracking-[0.2em] ${stage.textColor} uppercase mb-4 text-center`}>{stage.label}</div>
                  <div className="space-y-3">
                    {stage.items.map((item, ii) => {
                      const Icon = item.icon;
                      return (
                        <div key={ii} className="bg-black/40 rounded-lg p-3 border border-white/5 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm leading-tight">{item.name}</div>
                            <div className="text-white/35 text-xs">{item.detail}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {si < FLOW_STAGES.length - 1 && (
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 text-white/15" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical layout */}
          <div className="md:hidden space-y-3">
            {FLOW_STAGES.map((stage, si) => (
              <div key={si} className={`rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-5`}>
                <div className={`text-xs font-bold tracking-[0.2em] ${stage.textColor} uppercase mb-4 text-center`}>{stage.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  {stage.items.map((item, ii) => {
                    const Icon = item.icon;
                    return (
                      <div key={ii} className="bg-black/40 rounded-lg p-3 border border-white/5 flex flex-col items-center text-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-white font-medium text-xs">{item.name}</div>
                        <div className="text-white/35 text-[10px]">{item.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Jetson badge */}
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/35 text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>All running on NVIDIA Jetson AGX Orin (64GB)</span>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/story">
            <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl p-7 transition-all cursor-pointer h-full">
              <BookOpen className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold text-white mb-2">Story Builder</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Pick a storyline, explore floating questions, build data-driven narratives with LLM insights
              </p>
              <div className="mt-4 text-purple-400 text-sm font-medium">
                Explore stories &rarr;
              </div>
            </div>
          </Link>

          <Link href="/dashboard">
            <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-7 transition-all cursor-pointer h-full">
              <Map className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold text-white mb-2">Map & Chat</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Interactive map with 50K+ points, filter by ZIP, energy type, cluster. Chat with the data.
              </p>
              <div className="mt-4 text-blue-400 text-sm font-medium">
                Open dashboard &rarr;
              </div>
            </div>
          </Link>

          <Link href="/methodology">
            <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl p-7 transition-all cursor-pointer h-full">
              <BarChart3 className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold text-white mb-2">ML Pipeline</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Full methodology: NLP feature extraction, PCA, KMeans clustering, and cluster results.
              </p>
              <div className="mt-4 text-green-400 text-sm font-medium">
                View details &rarr;
              </div>
            </div>
          </Link>
        </div>

        {/* Post-Freeze Signal */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="text-sm text-white/30 uppercase tracking-wider mb-2">Post-2021 Freeze</div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-red-400">+246%</span>
              <span className="text-white/50 text-sm">Generator permits</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-bold text-amber-400">+214%</span>
              <span className="text-white/50 text-sm">Battery permits</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="text-sm text-white/30 uppercase tracking-wider mb-2">Coverage</div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-blue-400">840+</span>
              <span className="text-white/50 text-sm">ZIP codes</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-bold text-purple-400">15+</span>
              <span className="text-white/50 text-sm">Years of permit history</span>
            </div>
          </div>
        </div>

        {/* Data Source */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 mb-8">
          <div className="text-sm text-white/30 uppercase tracking-wider mb-3">Data Source</div>
          <p className="text-white/50 text-sm leading-relaxed">
            <a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              Austin Open Data &mdash; Issued Construction Permits
            </a>
            <span className="text-white/30 mx-2">&middot;</span>
            2.3M+ records, 63% geocoded, 840+ ZIP codes, 2009&ndash;2025
          </p>
        </div>

        {/* Team */}
        <div className="mb-8">
          <div className="text-sm text-white/30 uppercase tracking-wider mb-6 text-center">Team</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <a href="https://www.linkedin.com/in/jravinder" target="_blank" rel="noopener noreferrer" className="group bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-xl p-5 text-center transition-all hover:bg-white/8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">RJ</span>
              </div>
              <div className="text-white font-semibold text-sm">Ravinder Jilkapally</div>
              <div className="text-purple-400/60 text-xs mt-1.5 font-medium">GenAI &middot; GPU Pipeline</div>
            </a>
            <a href="https://www.linkedin.com/in/avanishj" target="_blank" rel="noopener noreferrer" className="group bg-white/5 border border-white/10 hover:border-blue-500/30 rounded-xl p-5 text-center transition-all hover:bg-white/8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">AJ</span>
              </div>
              <div className="text-white font-semibold text-sm">Avanish Joshi</div>
              <div className="text-blue-400/60 text-xs mt-1.5 font-medium">EDA &middot; Feature Engineering</div>
            </a>
            <a href="https://www.linkedin.com/in/tyroneavnit/" target="_blank" rel="noopener noreferrer" className="group bg-white/5 border border-white/10 hover:border-green-500/30 rounded-xl p-5 text-center transition-all hover:bg-white/8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">TA</span>
              </div>
              <div className="text-white font-semibold text-sm">Tyrone Avnit</div>
              <div className="text-green-400/60 text-xs mt-1.5 font-medium">UI &middot; Integration</div>
            </a>
            <a href="https://www.linkedin.com/in/siddharthgargava/" target="_blank" rel="noopener noreferrer" className="group bg-white/5 border border-white/10 hover:border-amber-500/30 rounded-xl p-5 text-center transition-all hover:bg-white/8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">SG</span>
              </div>
              <div className="text-white font-semibold text-sm">Siddharth Gargava</div>
              <div className="text-amber-400/60 text-xs mt-1.5 font-medium">NLP &middot; ML Pipeline</div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs mt-8">
          Built on NVIDIA Jetson AGX Orin &middot; CUDA &middot; RAPIDS &middot; Ollama &middot; Supabase &middot; Next.js 16
        </div>
      </div>
    </div>
  );
}
