"use client";

import { useState, useEffect } from "react";
import { Brain, Layers, Clock, Users, Cpu, Cloud, Database, ArrowRight, CheckCircle2, Circle, Zap, Calendar, Trophy } from "lucide-react";
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
    description: "Edge inference with 275 TOPS. Full stack runs locally.",
    color: "green",
    icon: Cpu,
  },
];

// Software with logos
const SOFTWARE = [
  { name: "Nemotron 3 Nano", category: "LLM", description: "NVIDIA's 31.6B MoE model for permit queries.", logo: "nvidia" },
  { name: "Ollama", category: "LLM Serving", description: "Local model serving, on-device inference.", logo: "ollama" },
  { name: "Python Pipeline", category: "Data", description: "GPU data processing.", logo: "nvidia" },
  { name: "Next.js", category: "Frontend", description: "React framework with API routes.", logo: "nextjs" },
  { name: "Supabase", category: "Database", description: "PostgreSQL for 2.34M permits.", logo: "supabase" },
  { name: "Leaflet", category: "Maps", description: "Interactive permit visualization.", logo: "leaflet" },
  { name: "Vercel", category: "Hosting", description: "Edge deployment and serverless functions.", logo: "vercel" },
];

// Logo components
const LOGOS: Record<string, React.ReactNode> = {
  nvidia: <img src="/nvidia-logo.png" alt="NVIDIA" className="w-5 h-5 object-contain rounded" />,
  ollama: <img src="/ollama.png" alt="Ollama" className="w-5 h-5 rounded invert" />,
  nextjs: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.251 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"/></svg>,
  supabase: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3ECF8E"><path d="M13.558 21.794c-.33.438-.992.136-.992-.41V13.5h7.464c.66 0 1.018-.768.596-1.28L9.442 2.206c-.33-.438-.992-.136-.992.41V10.5H1.97c-.66 0-1.018.768-.596 1.28l10.184 10.014z"/></svg>,
  leaflet: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#199900"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  vercel: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19.5h20L12 2z"/></svg>,
};

// Origin Story milestones
const MILESTONES = [
  { phase: "Discovery", title: "The Question", description: "What can 2.34M construction permits tell us about a city's energy future?", status: "completed" },
  { phase: "Build", title: "GPU Pipeline", description: "Processed millions of records on NVIDIA DGX for GPU-accelerated analysis.", status: "completed" },
  { phase: "Build", title: "ML Clustering", description: "AI categorization of 2.34M permits into actionable insights.", status: "completed" },
  { phase: "Insight", title: "The Story", description: "7,459 generators vs 2,874 batteries. Austinites don't trust the grid.", status: "completed" },
  { phase: "Award", title: "1st Place Urban Growth", description: "Won Urban Growth category at NVIDIA AITX Hackathon. Recognition for innovative use of GPU acceleration.", status: "completed", highlight: true },
  { phase: "Product", title: "Undervolt", description: "Evolving from hackathon project to full product. Edge deployment on Jetson.", status: "in-progress" },
];

// Team
const TEAM = [
  { 
    name: "Ravinder Jilkapally", 
    role: "Product & Engineering Lead", 
    tagline: "Scaling AI at Xpanse",
    focus: "Product, Platform, and Engineering leader with 18+ years building large scale AI/ML platforms, GenAI products, and cloud native data systems. 0→1 execution, multi-tenant AI architecture, scaling teams from prototype to production.", 
    linkedin: "https://linkedin.com/in/jravinder", 
    lead: true, 
    avatar: "https://www.gravatar.com/avatar/07e9975093e352d88e8a43b95bbf3295?s=200" 
  },
];

const HACKATHON_TEAM = [
  { name: "Tyrone Avnit", role: "Applied AI Engineer @ Civic", linkedin: "https://linkedin.com/in/tyroneavnit", avatar: "https://www.gravatar.com/avatar/2d91bf6a5069a39550bb7def3908500d?s=100" },
  { name: "Avanish Joshi", role: "Sr. Integration Architect @ Cepheid", linkedin: "https://linkedin.com/in/avanishj", avatar: "https://www.gravatar.com/avatar/e86d5d8cf4f6bddaf0615a45ec2dbde5?s=100" },
  { name: "Siddharth Gargava", role: "SDE-II @ AWS", linkedin: "https://linkedin.com/in/siddharthgargava", avatar: "https://www.gravatar.com/avatar/909de212a76ee4102373f34ba14ab4f5?s=100" },
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
      {/* Architecture Diagram */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <img src="/architecture.png" alt="Undervolt System Architecture" className="w-full" />
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
            <p className="text-white/60 text-sm mb-3">Pipeline designed to run on any hardware: NVIDIA DGX, Jetson Edge, or standard CPU. Currently deployed on NVIDIA Jetson AGX Orin 64GB for local inference with full data sovereignty.</p>
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Setup guide on GitHub
              <ArrowRight className="w-4 h-4" />
            </a>
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
                    <p className="text-white/60 text-xs">{item.role}</p>
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
                  <span className="text-xs text-white/60">{item.category}</span>
                </div>
              </div>
              <p className="text-white/60 text-sm">{item.description}</p>
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
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">How It Started</span>
        </div>
        <p className="text-white/70 text-sm mb-3">
          At the NVIDIA DGX Spark Frontier Hackathon in Austin, our team set out to answer one question: <em className="text-white">What could cities learn if their massive open datasets were finally explorable in real time?</em>
        </p>
        <p className="text-white/50 text-sm mb-3">
          With the same data and constraints as everyone else, we focused on building something meaningfully different. Using Austin&apos;s 2.34M construction permits, we built Undervolt — transforming messy, unstructured public data into real-time Urban Growth Intelligence.
        </p>
        <p className="text-white/50 text-sm mb-4">
          Cities struggle with slow, fragmented datasets that hide critical signals: grid stress, storage gaps, growth corridors, solar adoption. These signals already exist inside permit text — the challenge is extracting them at scale.
        </p>
        <a
          href="https://www.linkedin.com/posts/jravinder_excited-to-share-that-our-project-undervolt-activity-7283559414626160641-IQWZ"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Read the full story on LinkedIn
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Milestones - Vertical Timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />

        <div className="space-y-6">
          {MILESTONES.filter(m => m.phase !== "Award").map((m, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className={`absolute -left-8 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                m.status === 'in-progress'
                  ? 'border-amber-500 bg-black'
                  : 'border-emerald-500 bg-black'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  m.status === 'in-progress'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                }`} />
              </div>

              {/* Content */}
              <div>
                <span className={`text-xs font-medium uppercase tracking-wider ${
                  m.status === 'in-progress' ? 'text-amber-400' : 'text-emerald-400/60'
                }`}>{m.phase}</span>
                <h3 className="font-medium text-white mt-0.5">{m.title}</h3>
                <p className="text-white/50 text-sm mt-1">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Award Banner */}
      <a
        href="https://www.nvidia.com/en-us/events/dgx-spark-hackathon/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-500/40 relative overflow-hidden hover:border-amber-500/60 transition-colors"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-8 h-8 text-black" />
          </div>
          <div>
            <div className="text-amber-400 text-xs font-medium uppercase tracking-wider mb-1">NVIDIA DGX AITX Hackathon</div>
            <h3 className="text-2xl font-bold text-white">1st Place — Urban Growth</h3>
            <p className="text-white/60 text-sm mt-1">Urban Growth Category • Dec 2025</p>
          </div>
        </div>
      </a>
    </div>
  );
}


function Roadmap() {
  const roadmapItems = [
    {
      phase: "Hackathon",
      color: "emerald",
      status: "completed" as const,
      items: [
        "Built on NVIDIA DGX",
        "2.34M Austin permits processed",
        "GPU-accelerated ML pipeline",
        "1st Place Urban Growth - NVIDIA AITX",
      ]
    },
    {
      phase: "Current",
      color: "amber",
      status: "current" as const,
      items: [
        "Runs on NVIDIA Jetson AGX Orin",
        "Flexible: CPU, CUDA, or no GPU",
        "Nemotron 3 Nano local inference",
        "Cached AI for instant responses",
      ]
    },
    {
      phase: "Future",
      color: "purple",
      status: "upcoming" as const,
      items: [
        "Multi-city expansion",
        "Predictive analytics & forecasting",
        "Public API for developers",
        "Enterprise deployments",
      ]
    },
  ];

  const colorMap: Record<string, { text: string; dot: string; border: string }> = {
    emerald: { text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500" },
    amber: { text: "text-amber-400", dot: "bg-amber-500", border: "border-amber-500" },
    purple: { text: "text-purple-400", dot: "bg-purple-500", border: "border-purple-500" },
  };

  return (
    <div className="space-y-8">
      {/* Vertical Timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />

        <div className="space-y-10">
          {roadmapItems.map((section) => {
            const colors = colorMap[section.color];
            return (
              <div key={section.phase} className="relative">
                {/* Dot */}
                <div className={`absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full border-2 ${colors.border} bg-black flex items-center justify-center`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${section.status === 'current' ? 'animate-pulse' : ''}`} />
                </div>

                {/* Content */}
                <div>
                  <span className={`text-sm font-semibold ${colors.text}`}>{section.phase}</span>
                  <ul className="mt-2 space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 flex-shrink-0" />
                        <span className="text-sm text-white/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="space-y-8">
      {/* Lead */}
      <div>
        <h3 className="text-sm text-white/60 uppercase tracking-wider mb-4">Lead</h3>
        {TEAM.map((member) => (
          <div
            key={member.name}
            className="flex items-center gap-6 p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/5 border border-amber-500/20"
          >
            {member.avatar && (
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
                <img src={member.avatar} alt={member.name} className="relative w-24 h-24 rounded-full border-3 border-amber-500/40 flex-shrink-0" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl text-white font-semibold mb-1">{member.name}</h3>
              <p className="text-amber-400 font-medium">{member.role}</p>
              {member.tagline && <p className="text-white/40 text-sm mb-3">{member.tagline}</p>}
              <p className="text-white/60 text-sm">{member.focus}</p>
              <a 
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-white/40 text-sm hover:text-amber-400 transition-colors"
              >
                View LinkedIn <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Hackathon Team */}
      <div>
        <h3 className="text-sm text-white/60 uppercase tracking-wider mb-4">Hackathon Contributors</h3>
        <p className="text-white/50 text-sm mb-4">Special thanks to the team that helped build the initial prototype.</p>
        <div className="grid md:grid-cols-3 gap-3">
          {HACKATHON_TEAM.map((member) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] group"
            >
              {member.avatar && (
                <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full border border-white/10" />
              )}
              <div>
                <h4 className="text-white font-semibold">{member.name}</h4>
                <p className="text-white/50 text-sm">{member.role}</p>
                <p className="text-white/30 text-xs mt-1 group-hover:text-white/50 transition-colors">LinkedIn →</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
        <p className="text-white/50 text-sm mb-4">Questions or feedback?</p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 text-white/60 rounded-lg font-medium hover:bg-white/90 transition-all text-sm"
        >
          Get in Touch
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
