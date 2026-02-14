"use client";

import { CheckCircle2, Circle, Rocket, Trophy, Cpu, Zap, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

interface Milestone {
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
  highlight?: boolean;
}

const MILESTONES: Milestone[] = [
  {
    date: "Day 1",
    title: "The Challenge",
    description: "2.3M Austin permits. Unstructured text. 48 hours to find the signal in the noise.",
    status: "completed",
  },
  {
    date: "Day 1",
    title: "Data Wrangling",
    description: "RAPIDS cuDF on DGX Spark. Cleaned and normalized millions of records in seconds.",
    status: "completed",
  },
  {
    date: "Day 1",
    title: "ML Pipeline",
    description: "TF-IDF vectorization, PCA reduction, KMeans clustering. 8 distinct permit categories emerged.",
    status: "completed",
  },
  {
    date: "Day 2",
    title: "Energy Discovery",
    description: "Found the story: 7,459 generators vs 2,874 batteries. Grid trust is broken.",
    status: "completed",
    highlight: true,
  },
  {
    date: "Day 2",
    title: "Edge Vision",
    description: "Designed for Jetson deployment. Zero cloud. Data stays local.",
    status: "completed",
  },
  {
    date: "Day 2",
    title: "1st Place Urban Growth",
    description: "Infrastructure intelligence that cities actually need.",
    status: "completed",
    highlight: true,
  },
];

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
            <Trophy className="w-4 h-4" />
            From Hackathon to Production
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Project Timeline</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            The journey from a 48-hour hackathon to edge-deployed urban intelligence.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-white">2.3M</div>
            <div className="text-white/40 text-xs">Permits Analyzed</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-white">8</div>
            <div className="text-white/40 text-xs">ML Clusters</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-white">275</div>
            <div className="text-white/40 text-xs">TOPS on Edge</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-white/40 text-xs">Cloud Dependencies</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-white/10 transform md:-translate-x-1/2" />

          {MILESTONES.map((milestone, i) => {
            const isLeft = i % 2 === 0;
            const StatusIcon = milestone.status === "completed" ? CheckCircle2 :
                              milestone.status === "current" ? Zap : Circle;
            const statusColor = milestone.status === "completed" ? "text-green-400" :
                               milestone.status === "current" ? "text-yellow-400" : "text-white/30";

            return (
              <div key={i} className={`relative flex items-start gap-4 mb-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                {/* Content */}
                <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8"}`}>
                  <div className={`p-5 rounded-xl border ${
                    milestone.highlight
                      ? "bg-purple-500/10 border-purple-500/20"
                      : "bg-white/[0.02] border-white/5"
                  }`}>
                    <div className="flex items-center gap-2 mb-2 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      {milestone.date}
                    </div>
                    <h3 className={`font-semibold mb-2 ${milestone.highlight ? "text-purple-300" : "text-white"}`}>
                      {milestone.title}
                    </h3>
                    <p className="text-white/50 text-sm">{milestone.description}</p>
                  </div>
                </div>

                {/* Icon */}
                <div className={`absolute left-0 md:left-1/2 w-12 h-12 rounded-full border-2 flex items-center justify-center transform md:-translate-x-1/2 ${
                  milestone.status === "completed" ? "bg-green-500/10 border-green-500/30" :
                  milestone.status === "current" ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-white/5 border-white/10"
                }`}>
                  <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                </div>

                {/* Spacer for opposite side */}
                <div className="hidden md:block md:w-[calc(50%-2rem)]" />
              </div>
            );
          })}
        </div>

        {/* The Journey */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-green-500/10 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">From Cloud to Edge</h2>
              <p className="text-white/50 text-sm">The NVIDIA journey</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-black/30">
              <div className="text-purple-400 text-sm font-medium mb-2">Training Phase</div>
              <div className="text-white font-semibold">NVIDIA DGX Spark</div>
              <div className="text-white/40 text-xs mt-1">Grace Blackwell GPU acceleration for batch ML processing</div>
            </div>
            <div className="p-4 rounded-lg bg-black/30">
              <div className="text-green-400 text-sm font-medium mb-2">Production Phase</div>
              <div className="text-white font-semibold">NVIDIA Jetson AGX Orin</div>
              <div className="text-white/40 text-xs mt-1">64GB edge device for real-time inference</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all text-sm"
            >
              How It Works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
