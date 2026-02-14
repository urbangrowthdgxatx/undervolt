"use client";

import { Brain, Database, Zap, Globe, Cpu, Cloud, ArrowRight, Server, Workflow } from "lucide-react";
import Link from "next/link";

const PIPELINE = [
  {
    step: "01",
    icon: Database,
    title: "Data Ingestion",
    color: "blue",
    description: "2.34M permits from Austin Open Data Portal",
    tech: "cuDF (GPU DataFrame)",
  },
  {
    step: "02",
    icon: Brain,
    title: "Feature Extraction",
    color: "purple",
    description: "NLP on permit descriptions, keyword extraction",
    tech: "TF-IDF vectorization",
  },
  {
    step: "03",
    icon: Workflow,
    title: "Clustering",
    color: "amber",
    description: "8 category classification (solar, battery, EV, etc.)",
    tech: "PCA → KMeans",
  },
  {
    step: "04",
    icon: Globe,
    title: "Serving",
    color: "green",
    description: "Interactive maps, natural language queries",
    tech: "Nemotron 3 Nano via Ollama",
  },
];

const SIGNALS = [
  { name: "Solar Adoption", description: "Track installations by neighborhood and time" },
  { name: "Battery Storage", description: "Identify gaps in energy resilience" },
  { name: "Grid Stress", description: "Predict where infrastructure will strain" },
  { name: "Growth Corridors", description: "Spot development patterns early" },
  { name: "Remodel Surges", description: "Understand neighborhood transitions" },
  { name: "EV Readiness", description: "Map charger density and demand" },
];

const EDGE_BENEFITS = [
  { title: "Data Sovereignty", description: "Permit data stays local, no cloud uploads" },
  { title: "Local Processing", description: "Queries processed on-device, no network delays" },
  { title: "Cost Efficient", description: "One-time hardware cost vs recurring cloud fees" },
  { title: "Offline Capable", description: "Works without internet connectivity" },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            GPU-accelerated ML pipeline transforms raw permit data into urban intelligence.
            Built on DGX Spark, deployed to edge.
          </p>
        </div>

        {/* Architecture Section */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-8 text-center text-white/80">Technical Pipeline</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PIPELINE.map((item) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                green: "bg-green-500/10 text-green-400 border-green-500/20",
              };
              return (
                <div
                  key={item.step}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[item.color].split(" ").slice(0, 1).join(" ")}`}>
                      <Icon className={`w-5 h-5 ${colorMap[item.color].split(" ").slice(1, 2).join(" ")}`} />
                    </div>
                    <div>
                      <div className="text-white/30 text-xs mb-1">{item.step}</div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-white/50 text-sm mb-2">{item.description}</p>
                      <code className="text-xs px-2 py-1 rounded bg-white/5 text-white/40">{item.tech}</code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware Section */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-8 text-center text-white/80">Infrastructure</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Training */}
            <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Training</h3>
                  <p className="text-white/40 text-xs">NVIDIA DGX Spark</p>
                </div>
              </div>
              <p className="text-white/50 text-sm">
                ML pipeline development and batch processing of 2.34M permit records with GPU acceleration.
              </p>
            </div>

            {/* Deployment */}
            <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Production</h3>
                  <p className="text-white/40 text-xs">Jetson AGX Orin 64GB</p>
                </div>
              </div>
              <p className="text-white/50 text-sm">
                Edge deployment with Nemotron 3 Nano (31.6B MoE) served via Ollama, real-time query processing.
              </p>
            </div>
          </div>
        </div>

        {/* Why Edge */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-8 text-center text-white/80">Why Edge Deployment?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EDGE_BENEFITS.map((benefit, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                <p className="text-white font-medium text-sm mb-1">{benefit.title}</p>
                <p className="text-white/40 text-xs">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signals We Extract */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-8 text-center text-white/80">Signals Extracted</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SIGNALS.map((signal, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <p className="text-white font-medium text-sm mb-1">{signal.name}</p>
                <p className="text-white/40 text-xs">{signal.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics (Placeholders) */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-8 text-center text-white/80">Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
              <p className="text-2xl font-bold text-white mb-1">2.34M</p>
              <p className="text-white/40 text-xs">Permits processed</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
              <p className="text-2xl font-bold text-white mb-1">8</p>
              <p className="text-white/40 text-xs">Energy categories</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
              <p className="text-2xl font-bold text-white mb-1">&lt;50ms</p>
              <p className="text-white/40 text-xs">Cached query latency</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
              <p className="text-2xl font-bold text-white mb-1">275</p>
              <p className="text-white/40 text-xs">TOPS (Jetson Orin)</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-6">
            Interested in applying this approach to your city's data?
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all text-sm"
          >
            Get in Touch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
