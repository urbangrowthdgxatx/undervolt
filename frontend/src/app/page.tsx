"use client";

import Link from "next/link";
import { BookOpen, Map, Sparkles, Zap, Database, Brain } from "lucide-react";

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 story-bg">
      <div className="max-w-4xl w-full pt-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-12 h-12 text-purple-400" />
            <h1 className="text-6xl font-bold text-white">Undervolt</h1>
          </div>
          <p className="text-2xl text-white/40 mt-4">
            Austin Infrastructure Intelligence
          </p>
          <p className="text-lg text-white/30 mt-2">
            Extracting energy signals from 2.3M construction permits
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <Database className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">2.3M Permits</h3>
            <p className="text-white/50 text-sm">
              Austin construction data (2015-2025) with ML clustering and LLM-extracted features
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <Brain className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Local LLM</h3>
            <p className="text-white/50 text-sm">
              GPU-accelerated Llama 3.2 3B on Jetson AGX Orin (~1.3s responses)
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <Sparkles className="w-8 h-8 text-pink-400 mb-3" />
            <h3 className="text-white font-semibold mb-2">Energy Focus</h3>
            <p className="text-white/50 text-sm">
              Solar, batteries, EV chargers, generators, and grid infrastructure
            </p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/story">
            <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-8 transition-all cursor-pointer">
              <BookOpen className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold text-white mb-2">Story Builder</h2>
              <p className="text-white/50">
                Narrative UI with storyline cards, floating questions, and LLM-powered insights
              </p>
              <div className="mt-4 text-purple-400 text-sm font-medium">
                Explore storylines →
              </div>
            </div>
          </Link>

          <Link href="/dashboard">
            <div className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-8 transition-all cursor-pointer">
              <Map className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-2xl font-bold text-white mb-2">Map & Chat</h2>
              <p className="text-white/50">
                Interactive Mapbox visualization with chat interface and analytics charts
              </p>
              <div className="mt-4 text-blue-400 text-sm font-medium">
                View map →
              </div>
            </div>
          </Link>
        </div>

        {/* Key Stats */}
        <div className="mt-12 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-purple-400">+547%</div>
            <div className="text-sm text-white/30">Demolition CAGR</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">10K</div>
            <div className="text-sm text-white/30">Battery Permits</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400">2.4K</div>
            <div className="text-sm text-white/30">Solar Permits</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">41%</div>
            <div className="text-sm text-white/30">New Construction</div>
          </div>
        </div>
      </div>
    </div>
  );
}
