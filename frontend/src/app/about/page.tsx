"use client";

import { useState, useEffect } from "react";
import { Brain, Layers, Clock, Users, Cpu, Cloud, Database, ArrowRight, CheckCircle2, Circle, Zap,  Calendar } from "lucide-react";
import Link from "next/link";

type Tab = "how" | "stack" | "story" | "roadmap" | "team";

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: "how", label: "How It Works", icon: Brain },
  { id: "stack", label: "Tech Stack", icon: Layers },
  { id: "story", label: "Origin Story", icon: Clock },
  { id: "roadmap", label: "Roadmap", icon: Zap },
  { id: "team", label: "Team", icon: Users },
];

// Pipeline steps - simplified
const PIPELINE = [
  { step: "01", label: "Ingest", description: "2.34M permits from Austin Open Data", icon: "database", color: "emerald" },
  { step: "02", label: "Process", description: "GPU-accelerated on NVIDIA Jetson", icon: "cpu", color: "purple" },
  { step: "03", label: "Analyze", description: "AI categorization with Nemotron", icon: "sparkles", color: "amber" },
  { step: "04", label: "Serve", description: "Interactive maps, chat & reports", icon: "globe", color: "blue" },
];
// Hardware
const HARDWARE = [
  {
    name: "NVIDIA Jetson AGX Orin 64GB",
    role: "Production Deployment",
    description: "Edge inference with 275 TOPS. Full stack runs locally with zero cloud dependency.",
    color: "green",
    icon: Cpu,
  },
];

// Software with logos
const SOFTWARE = [
  { name: "Nemotron Mini 4B", category: "LLM", description: "NVIDIA's instruction-tuned model for permit queries.", logo: "nvidia" },
  { name: "Ollama", category: "LLM Serving", description: "Local model serving, on-device inference.", logo: "ollama" },
  { name: "Python Pipeline", category: "Data", description: "GPU data processing.", logo: "nvidia" },
  { name: "Next.js", category: "Frontend", description: "React framework with API routes.", logo: "nextjs" },
  { name: "Supabase", category: "Database", description: "PostgreSQL for 2.3M permits.", logo: "supabase" },
  { name: "Leaflet", category: "Maps", description: "Interactive permit visualization.", logo: "leaflet" },
  { name: "Vercel", category: "Hosting", description: "Edge deployment and serverless functions.", logo: "vercel" },
];

// Logo components
const LOGOS: Record<string, React.ReactNode> = {
  nvidia: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#76B900"><path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.412 0-.807-.063-1.167-.18v-4.475c1.224.164 1.472.768 2.209 2.063l1.722-1.465s-1.373-1.842-3.506-1.842c-.147 0-.287.009-.425.023v-.001zm0-4.762v2.06l.424-.036c5.136-.189 8.508 4.256 8.508 4.256s-3.898 4.823-7.283 4.823a5.5 5.5 0 0 1-1.649-.251v1.345a6.9 6.9 0 0 0 1.423.153c4.834 0 8.291-2.867 10.579-4.971.306.262 1.561 1.064 1.818 1.393-2.163 1.78-7.239 4.853-12.319 4.853a9.3 9.3 0 0 1-1.501-.122v1.453h14.039V4.036H8.948zm0 10.327v1.146a5.5 5.5 0 0 1-1.167-.251V8.632c.377-.095.774-.153 1.167-.169v.335c-2.052.163-3.478 2.159-3.478 2.159s1.18 2.406 3.478 3.406z"/></svg>,
  ollama: <img src="/ollama.png" alt="Ollama" className="w-5 h-5" />,
  nextjs: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>,
  supabase: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3ECF8E"><path d="M13.558 21.794c-.33.438-.992.136-.992-.41V13.5h7.464c.66 0 1.018-.768.596-1.28L9.442 2.206c-.33-.438-.992-.136-.992.41V10.5H1.97c-.66 0-1.018.768-.596 1.28l10.184 10.014z"/></svg>,
  leaflet: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#199900"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  vercel: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19.5h20L12 2z"/></svg>,
};

// Origin Story milestones
const MILESTONES = [
  { phase: "Discovery", title: "The Question", description: "What can 2.3M construction permits tell us about a city's energy future?", status: "completed" },
  { phase: "Build", title: "GPU Pipeline", description: "Processed millions of records on Jetson for GPU-accelerated analysis.", status: "completed" },
  { phase: "Build", title: "ML Clustering", description: "AI categorization of 2.34M permits into actionable insights.", status: "completed" },
  { phase: "Insight", title: "The Story", description: "7,293 generators vs 1,172 batteries. Austinites don't trust the grid.", status: "completed", highlight: true },
  { phase: "Deploy", title: "Edge-First", description: "Full stack on Jetson AGX Orin. Zero cloud. Data sovereignty.", status: "completed" },
];

// Team
const TEAM = [
  { name: "Ravinder Jilkapally", role: "Lead", focus: "Architecture, GPU pipelines, edge deployment", linkedin: "https://linkedin.com/in/jravinder", lead: true },
];

const HACKATHON_TEAM = [
  { name: "Tyrone Avnit", role: "Full Stack", linkedin: "https://linkedin.com/in/tyroneavnit" },
  { name: "Avanish Joshi", role: "Data Science", linkedin: "https://linkedin.com/in/avanishj" },
  { name: "Siddharth Gargava", role: "ML Engineer", linkedin: "https://linkedin.com/in/siddharthgargava" },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<Tab>("how");

  // Handle hash-based navigation
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (hash && TABS.some(t => t.id === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">About Undervolt</h1>
          <p className="text-white/50">GPU-accelerated infrastructure intelligence for cities.</p>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
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
        {activeTab === "story" && <OriginStory />}
        {activeTab === "roadmap" && <Roadmap />}
        {activeTab === "team" && <Team />}
      </div>
    </div>
  );
}

function HowItWorks() {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
  };
  
  return (
    <div className="space-y-12">
      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400">2.34M</div>
          <div className="text-xs text-white/50">Permits Analyzed</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
          <div className="text-2xl font-bold text-purple-400">64GB</div>
          <div className="text-xs text-white/50">Jetson Memory</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">4B</div>
          <div className="text-xs text-white/50">Nemotron Params</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-400">24+</div>
          <div className="text-xs text-white/50">Years of Data</div>
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Data Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PIPELINE.map((item, i) => (
            <div key={item.step} className={`relative p-5 rounded-xl bg-gradient-to-br border ${colorMap[item.color]}`}>
              <div className="text-3xl font-bold opacity-20 absolute top-2 right-3">{item.step}</div>
              <div className="text-lg font-semibold text-white mb-2">{item.label}</div>
              <div className="text-sm text-white/60">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insight */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 via-transparent to-purple-500/10 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="text-3xl">⚡</div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Run Anywhere</h3>
            <p className="text-white/60 text-sm">Pipeline designed to run on any hardware: DGX Cloud, Jetson Edge, or standard CPU. Currently deployed on NVIDIA Jetson AGX Orin 64GB for local inference with full data sovereignty.</p>
          </div>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  {LOGOS[item.logo]}
                </div>
                <div>
                  <h3 className="text-white font-medium">{item.name}</h3>
                  <span className="text-xs text-white/40">{item.category}</span>
                </div>
              </div>
              <p className="text-white/40 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OriginStory() {
  return (
    <div className="space-y-8">
      {/* Origin banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">How It Started</span>
        </div>
        <p className="text-white/50 text-sm">
          Austin, Texas. A team of 4 engineers asked: what can construction permits tell us about a city's energy future?
        </p>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        {MILESTONES.map((m, i) => {
          return (
            <div key={i} className={`flex gap-4 p-4 rounded-xl border ${m.highlight ? "bg-purple-500/5 border-purple-500/20" : "bg-white/[0.02] border-white/5"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500/10`}>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-white/5">{m.phase}</span>
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


function Roadmap() {
  const roadmapItems = [
    { 
      phase: "Hackathon", 
      color: "emerald",
      items: [
        "Built on NVIDIA DGX Cloud",
        "2.34M Austin permits processed",
        "GPU-accelerated ML pipeline",
        "1st Place - NVIDIA AITX",
      ]
    },
    { 
      phase: "Current", 
      color: "amber",
      items: [
        "Runs on NVIDIA Jetson AGX Orin",
        "Flexible: CPU, CUDA, or no GPU",
        "Nemotron 4B local inference",
        "Cached AI for instant responses",
      ]
    },
    { 
      phase: "Future", 
      color: "purple",
      items: [
        "Multi-city expansion",
        "Predictive analytics & forecasting",
        "Public API for developers",
        "Enterprise deployments",
      ]
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" },
  };

  return (
    <div className="space-y-8">
      {/* Timeline */}
      <div className="grid md:grid-cols-3 gap-6">
        {roadmapItems.map((section) => {
          const colors = colorMap[section.color];
          return (
            <div key={section.phase} className="relative">
              {/* Phase header */}
              <div className={`flex items-center gap-2 mb-4`}>
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <span className={`font-semibold ${colors.text}`}>{section.phase}</span>
              </div>
              {/* Items */}
              <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border} space-y-3`}>
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 flex-shrink-0" />
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white mb-1">Open Source</h3>
          <p className="text-white/50 text-sm">Undervolt is MIT licensed. Fork it for your city.</p>
        </div>
        <a 
          href="https://github.com/urbangrowthdgxatx/undervolt" 
          target="_blank"
          className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors text-sm"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="space-y-8">
      {/* Lead */}
      <div>
        <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">Project Lead</h3>
        {TEAM.map((member) => (
          <a
            key={member.name}
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-colors group"
          >
            <h3 className="text-xl text-white font-semibold mb-1">{member.name}</h3>
            <p className="text-amber-400 text-sm mb-2">{member.role}</p>
            <p className="text-white/50 text-sm">{member.focus}</p>
            <div className="mt-4 flex items-center gap-1 text-white/30 text-xs group-hover:text-white/50 transition-colors">
              LinkedIn <ArrowRight className="w-3 h-3" />
            </div>
          </a>
        ))}
      </div>

      {/* Hackathon Team */}
      <div>
        <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">Hackathon Contributors</h3>
        <p className="text-white/50 text-sm mb-4">Special thanks to the team that helped build the initial prototype.</p>
        <div className="grid md:grid-cols-3 gap-3">
          {HACKATHON_TEAM.map((member) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
            >
              <h4 className="text-white font-medium text-sm">{member.name}</h4>
              <p className="text-white/40 text-xs">{member.role}</p>
            </a>
          ))}
        </div>
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
