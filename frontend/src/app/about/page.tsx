"use client";

import { useState } from "react";
import { Brain, Layers, Clock, Users, Cpu, Cloud, Database, ArrowRight, CheckCircle2, Circle, Zap, Trophy, Calendar } from "lucide-react";
import Link from "next/link";

type Tab = "how" | "stack" | "timeline" | "team";

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "how", label: "How It Works", icon: Brain },
  { id: "stack", label: "Tech Stack", icon: Layers },
  { id: "timeline", label: "The Build", icon: Clock },
  { id: "team", label: "Team", icon: Users },
];

// Pipeline steps
const PIPELINE = [
  { step: "01", label: "Ingest", description: "Austin Open Data API" },
  { step: "02", label: "Clean", description: "cuDF normalization" },
  { step: "03", label: "Extract", description: "TF-IDF vectorization" },
  { step: "04", label: "Reduce", description: "PCA to 50 components" },
  { step: "05", label: "Cluster", description: "KMeans into 8 categories" },
  { step: "06", label: "Serve", description: "API + LLM + Maps" },
];

// Hardware
const HARDWARE = [
  {
    name: "NVIDIA DGX Spark",
    role: "Training & Development",
    description: "GPU-accelerated ML pipeline. Batch processing of 2.3M permits with RAPIDS cuDF.",
    color: "purple",
    icon: Cloud,
  },
  {
    name: "Jetson AGX Orin 64GB",
    role: "Production Deployment",
    description: "Edge inference with 275 TOPS. Full stack runs locally with zero cloud dependency.",
    color: "green",
    icon: Cpu,
  },
];

// Software
const SOFTWARE = [
  { name: "Nemotron Mini 4B", category: "LLM", description: "NVIDIA's instruction-tuned model for permit queries." },
  { name: "Ollama", category: "LLM Serving", description: "Local model serving, on-device inference." },
  { name: "RAPIDS cuDF", category: "Data", description: "GPU DataFrame operations at GPU speed." },
  { name: "Next.js", category: "Frontend", description: "React framework with API routes." },
  { name: "Supabase", category: "Database", description: "PostgreSQL for 2.3M permits." },
  { name: "Leaflet", category: "Maps", description: "Interactive permit visualization." },
];

// Timeline - Hackathon Journey
const MILESTONES = [
  { date: "Day 1", title: "The Challenge", description: "2.3M Austin permits. Unstructured text. 48 hours to find the signal in the noise.", status: "completed" },
  { date: "Day 1", title: "Data Wrangling", description: "RAPIDS cuDF on DGX Spark. Cleaned and normalized millions of records in seconds.", status: "completed" },
  { date: "Day 1", title: "ML Pipeline", description: "TF-IDF vectorization, PCA reduction, KMeans clustering. 8 distinct permit categories emerged.", status: "completed" },
  { date: "Day 2", title: "Energy Discovery", description: "Found the story: 7,293 generators vs 1,172 batteries. Grid trust is broken.", status: "completed", highlight: true },
  { date: "Day 2", title: "Edge Vision", description: "Designed for Jetson deployment. Zero cloud. Data stays local.", status: "completed" },
  { date: "Day 2", title: "1st Place Urban Growth", description: "Judges saw what we saw: infrastructure intelligence that cities actually need.", status: "completed", highlight: true },
];

// Team
const TEAM = [
  { name: "Ravinder Jilkapally", role: "GenAI Lead", focus: "Pipeline design, GPU optimization, vLLM", linkedin: "https://linkedin.com/in/jravinder" },
  { name: "Avanish Joshi", role: "Data Science", focus: "EDA, trend identification, feature engineering", linkedin: "https://linkedin.com/in/avanishj" },
  { name: "Tyrone Avnit", role: "Full Stack", focus: "UI prototyping, end-to-end integration", linkedin: "https://linkedin.com/in/tyroneavnit" },
  { name: "Siddharth Gargava", role: "ML Engineer", focus: "NLP system, GPU feature extraction", linkedin: "https://linkedin.com/in/siddharthgargava" },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<Tab>("how");

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4">
            <Trophy className="w-3 h-3" />
            1st Place Urban Growth
          </div>
          <h1 className="text-3xl font-bold mb-2">Built in 48 Hours</h1>
          <p className="text-white/50">What happens when you point GPU-accelerated ML at 2.3 million construction permits.</p>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === id
                    ? "border-white text-white"
                    : "border-transparent text-white/50 hover:text-white/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {activeTab === "how" && <HowItWorks />}
        {activeTab === "stack" && <TechStack />}
        {activeTab === "timeline" && <Timeline />}
        {activeTab === "team" && <Team />}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="space-y-12">
      {/* Pipeline */}
      <div>
        <h2 className="text-xl font-semibold mb-6">ML Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PIPELINE.map((item) => (
            <div key={item.step} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
              <div className="text-white/30 text-xs mb-2">{item.step}</div>
              <div className="text-white font-medium text-sm mb-1">{item.label}</div>
              <div className="text-white/40 text-xs">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Edge */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Why Edge Deployment?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Data Sovereignty", desc: "Permit data stays local. No cloud transmission." },
            { title: "Zero Latency", desc: "On-device inference. No network round-trips." },
            { title: "Cost Efficient", desc: "$2K hardware vs $50K/month cloud." },
            { title: "Offline Capable", desc: "Works without internet connectivity." },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-bold">2.3M</div>
          <div className="text-white/40 text-xs">Permits Analyzed</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-bold">8</div>
          <div className="text-white/40 text-xs">ML Clusters</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-bold">275</div>
          <div className="text-white/40 text-xs">TOPS on Edge</div>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-white/40 text-xs">Cloud Dependencies</div>
        </div>
      </div>
    </div>
  );
}

function TechStack() {
  return (
    <div className="space-y-12">
      {/* Hardware */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Hardware</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {HARDWARE.map((item) => {
            const Icon = item.icon;
            const colorClasses = item.color === "purple"
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-green-500/10 border-green-500/20 text-green-400";
            return (
              <div key={item.name} className={`p-6 rounded-xl border ${colorClasses.split(" ").slice(0, 2).join(" ")}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.split(" ")[0]}`}>
                    <Icon className={`w-5 h-5 ${colorClasses.split(" ")[2]}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.name}</h3>
                    <p className="text-white/40 text-xs">{item.role}</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Software */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Software</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {SOFTWARE.map((item) => (
            <div key={item.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-medium">{item.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">{item.category}</span>
              </div>
              <p className="text-white/40 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partners */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Built With Support From</h2>
        <div className="flex flex-wrap items-center justify-center gap-8 py-8 px-6 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-white/40 font-medium">NVIDIA</span>
          <span className="text-white/40 font-medium">Ollama</span>
          <span className="text-white/40 font-medium">AITX Community</span>
          <span className="text-white/40 font-medium">Hugging Face</span>
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  return (
    <div className="space-y-8">
      {/* Journey banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">NVIDIA DGX Spark Hackathon</span>
        </div>
        <p className="text-white/50 text-sm">
          Austin, January 2026. 48 hours. 4 engineers. One question: what can construction permits tell us about a city's future?
        </p>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {MILESTONES.map((m, i) => {
          const StatusIcon = m.status === "completed" ? CheckCircle2 : m.status === "current" ? Zap : Circle;
          const statusColor = m.status === "completed" ? "text-green-400" : m.status === "current" ? "text-yellow-400" : "text-white/30";

          return (
            <div key={i} className={`flex gap-4 p-4 rounded-xl border ${m.highlight ? "bg-purple-500/5 border-purple-500/20" : "bg-white/[0.02] border-white/5"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.status === "completed" ? "bg-green-500/10" : m.status === "current" ? "bg-yellow-500/10" : "bg-white/5"
              }`}>
                <StatusIcon className={`w-5 h-5 ${statusColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <Calendar className="w-3 h-3" />
                  {m.date}
                </div>
                <h3 className="font-medium mb-1">{m.title}</h3>
                <p className="text-white/50 text-sm">{m.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="space-y-8">
      <p className="text-white/50">
        Built in 48 hours at the NVIDIA DGX Spark Hackathon in Austin, January 2026.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {TEAM.map((member) => (
          <a
            key={member.name}
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
          >
            <h3 className="text-white font-semibold mb-1">{member.name}</h3>
            <p className="text-white/40 text-sm mb-2">{member.role}</p>
            <p className="text-white/30 text-xs">{member.focus}</p>
            <div className="mt-3 flex items-center gap-1 text-white/30 text-xs group-hover:text-white/50 transition-colors">
              LinkedIn <ArrowRight className="w-3 h-3" />
            </div>
          </a>
        ))}
      </div>

      {/* Contact */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
        <p className="text-white/50 text-sm mb-4">Questions or feedback?</p>
        <a
          href="mailto:undervolt-team@aisoft.us"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all text-sm"
        >
          Get in Touch
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
