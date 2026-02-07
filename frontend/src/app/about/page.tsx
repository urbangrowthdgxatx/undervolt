"use client";

import { useState } from "react";
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
  { name: "RAPIDS cuDF", category: "Data", description: "GPU DataFrame operations at GPU speed.", logo: "nvidia" },
  { name: "Next.js", category: "Frontend", description: "React framework with API routes.", logo: "nextjs" },
  { name: "Supabase", category: "Database", description: "PostgreSQL for 2.3M permits.", logo: "supabase" },
  { name: "Leaflet", category: "Maps", description: "Interactive permit visualization.", logo: "leaflet" },
  { name: "Vercel", category: "Hosting", description: "Edge deployment and serverless functions.", logo: "vercel" },
];

// Logo components
const LOGOS: Record<string, React.ReactNode> = {
  nvidia: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#76B900"><path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.412 0-.807-.063-1.167-.18v-4.475c1.224.164 1.472.768 2.209 2.063l1.722-1.465s-1.373-1.842-3.506-1.842c-.147 0-.287.009-.425.023v-.001zm0-4.762v2.06l.424-.036c5.136-.189 8.508 4.256 8.508 4.256s-3.898 4.823-7.283 4.823a5.5 5.5 0 0 1-1.649-.251v1.345a6.9 6.9 0 0 0 1.423.153c4.834 0 8.291-2.867 10.579-4.971.306.262 1.561 1.064 1.818 1.393-2.163 1.78-7.239 4.853-12.319 4.853a9.3 9.3 0 0 1-1.501-.122v1.453h14.039V4.036H8.948zm0 10.327v1.146a5.5 5.5 0 0 1-1.167-.251V8.632c.377-.095.774-.153 1.167-.169v.335c-2.052.163-3.478 2.159-3.478 2.159s1.18 2.406 3.478 3.406z"/></svg>,
  ollama: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>,
  nextjs: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>,
  supabase: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3ECF8E"><path d="M13.558 21.794c-.33.438-.992.136-.992-.41V13.5h7.464c.66 0 1.018-.768.596-1.28L9.442 2.206c-.33-.438-.992-.136-.992.41V10.5H1.97c-.66 0-1.018.768-.596 1.28l10.184 10.014z"/></svg>,
  leaflet: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#199900"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  vercel: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19.5h20L12 2z"/></svg>,
};

// Origin Story milestones
const MILESTONES = [
  { phase: "Discovery", title: "The Question", description: "What can 2.3M construction permits tell us about a city's energy future?", status: "completed" },
  { phase: "Build", title: "GPU Pipeline", description: "RAPIDS cuDF processed millions of records in seconds on DGX Spark.", status: "completed" },
  { phase: "Build", title: "ML Clustering", description: "TF-IDF, PCA, KMeans - 8 distinct permit categories emerged from unstructured text.", status: "completed" },
  { phase: "Insight", title: "The Story", description: "7,293 generators vs 1,172 batteries. Austinites don't trust the grid.", status: "completed", highlight: true },
  { phase: "Deploy", title: "Edge-First", description: "Full stack on Jetson AGX Orin. Zero cloud. Data sovereignty.", status: "completed" },
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
          <h1 className="text-3xl font-bold mb-2">About Undervolt</h1>
          <p className="text-white/50">GPU-accelerated infrastructure intelligence for cities.</p>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
  return (
    <div className="space-y-12">
      {/* Value Proposition */}
      <div>
        <h2 className="text-xl font-semibold mb-6">What Makes Undervolt Unique</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="text-2xl mb-2">🔓</div>
            <h3 className="font-semibold mb-1">Open Source</h3>
            <p className="text-white/50 text-sm">MIT licensed. Fork it for your city, customize freely, no licensing fees.</p>
          </div>
          <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/20">
            <div className="text-2xl mb-2">🏠</div>
            <h3 className="font-semibold mb-1">Edge-first</h3>
            <p className="text-white/50 text-sm">Runs entirely on NVIDIA Jetson. Your data stays local. Zero cloud costs.</p>
          </div>
          <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">GPU-accelerated</h3>
            <p className="text-white/50 text-sm">NVIDIA RAPIDS processes 2.34M permits in seconds, not hours.</p>
          </div>
          <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="text-2xl mb-2">📖</div>
            <h3 className="font-semibold mb-1">Story-driven</h3>
            <p className="text-white/50 text-sm">Turns raw data into insights like the 22:1 solar-to-battery ratio.</p>
          </div>
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="text-2xl mb-2">🔋</div>
            <h3 className="font-semibold mb-1">Energy Focus</h3>
            <p className="text-white/50 text-sm">Where is the grid failing? Who is preparing? Where are the gaps?</p>
          </div>
          <div className="p-5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold mb-1">Local LLM</h3>
            <p className="text-white/50 text-sm">Ollama + Nemotron for on-device AI without cloud APIs.</p>
          </div>
        </div>
        <p className="text-white/40 text-sm mt-6 text-center italic">Infrastructure intelligence that cities can own and operate themselves.</p>
      </div>

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
            { title: "Cost Efficient", desc: "One-time hardware cost vs recurring cloud fees." },
            { title: "Offline Capable", desc: "Works without internet connectivity." },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
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
  const completed = [
    { title: "Story-driven Explore Page", desc: "Scroll-based narrative with interactive map" },
    { title: "Mobile Navigation", desc: "Responsive UI across all devices" },
    { title: "Dynamic OG Images", desc: "Auto-generated social cards" },
    { title: "GPU Backend Architecture", desc: "Multi-backend: CPU, cuPy, PyTorch" },
    { title: "Waitlist & Auth", desc: "Email signup with usage tracking" },
  ];

  const inProgress = [
    { title: "cuML GPU Clustering", desc: "NVIDIA RAPIDS cuML for GPU-accelerated KMeans" },
    { title: "NeMo Integration", desc: "NVIDIA NeMo for permit classification" },
    { title: "Multi-city Expansion", desc: "Preparing pipeline for additional cities" },
  ];

  const planned = [
    { title: "Predictive Analytics", desc: "Forecast permit trends and energy adoption" },
    { title: "Public API", desc: "API access for developers and researchers" },
    { title: "Enterprise Features", desc: "Custom deployments, SLAs, dedicated support" },
  ];

  return (
    <div className="space-y-12">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-semibold">Recently Shipped</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {completed.map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-semibold">In Progress</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {inProgress.map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Circle className="w-5 h-5 text-white/30" />
          <h2 className="text-xl font-semibold">On the Roadmap</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {planned.map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-white font-medium mb-1">{item.title}</h3>
              <p className="text-white/40 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
        <h3 className="font-semibold mb-2">Want to Contribute?</h3>
        <p className="text-white/50 text-sm mb-4">Undervolt is open source. Fork for your city!</p>
        <a href="https://github.com/urbangrowthdgxatx/undervolt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 text-sm">
          View on GitHub
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="space-y-8">
      <p className="text-white/50">
        The team behind Undervolt.
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
