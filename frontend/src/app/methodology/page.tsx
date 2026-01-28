"use client";

import { Brain, Cpu, Database, GitBranch, Layers, Zap, Globe, MessageSquare, Map, ArrowDown } from "lucide-react";

const CLUSTERS = [
  { id: 0, name: "New Residential Construction", pct: 19.8, count: 462093, color: "#10b981", keywords: ["new (94.9%)", "residential (20.9%)", "single-family (5.3%)"] },
  { id: 1, name: "General Construction & Repairs", pct: 30.7, count: 719030, color: "#ec4899", keywords: ["new (24.0%)", "repair (5.9%)", "remodel (3.7%)"] },
  { id: 2, name: "Electrical & Roofing Work", pct: 15.3, count: 358189, color: "#f59e0b", keywords: ["new (25.6%)", "electrical (8.4%)", "roof (8.1%)"] },
  { id: 3, name: "Major Residential Remodels", pct: 0.9, count: 20994, color: "#6b7280", keywords: ["remodel (47.9%)", "new (17.4%)", "commercial (8.7%)"] },
  { id: 4, name: "HVAC Installations", pct: 4.1, count: 95631, color: "#3b82f6", keywords: ["new (8.4%)", "hvac (7.0%)", "remodel (5.0%)"] },
  { id: 5, name: "Demolition Projects", pct: 18.4, count: 431462, color: "#ef4444", keywords: ["demolition (26.7%)", "new (1.8%)"] },
  { id: 6, name: "Window & Multi-Trade Remodels", pct: 9.2, count: 214517, color: "#a855f7", keywords: ["window (54.7%)", "new (34.9%)", "plumbing (34.6%)"] },
  { id: 7, name: "Foundation Repairs", pct: 1.6, count: 37085, color: "#6366f1", keywords: ["foundation (95.5%)", "repair (75.9%)", "new (7.1%)"] },
];

const PIPELINE_STEPS = [
  {
    icon: Database,
    title: "1. Data Ingestion",
    subtitle: "2.34M permits from Austin Open Data",
    details: [
      "Source: data.austintexas.gov (Issued Construction Permits)",
      "Coverage: 1980\u20132026, primarily 2015\u20132025",
      "Fields: permit description, work class, type, address, coordinates, valuations",
      "Loaded via cuDF (GPU-accelerated DataFrame) on NVIDIA Jetson AGX Orin",
    ],
  },
  {
    icon: Zap,
    title: "2. Data Cleaning",
    subtitle: "Normalize, filter, parse",
    details: [
      "Coordinate filtering: Austin metro bounds (30.0\u201330.6\u00b0N, 97.5\u201398.0\u00b0W)",
      "Date parsing across 5 date columns (applied, issued, status, expires, completed)",
      "Numeric normalization: 18 valuation/sqft columns",
      "ZIP code extraction from 3 source columns with fallback chain",
    ],
  },
  {
    icon: Brain,
    title: "3. NLP Feature Extraction",
    subtitle: "16 keywords \u00d7 5 text columns \u2192 80 binary features",
    details: [
      "Text columns: description, work_class, permit_class, permit_type_desc, permit_type",
      "16 domain keywords: residential, commercial, remodel, repair, new, demolition, etc.",
      "GPU-accelerated substring matching via cuDF str.contains",
      "Output: 80 binary feature columns per permit",
    ],
  },
  {
    icon: Layers,
    title: "4. Dimensionality Reduction",
    subtitle: "PCA: 80 features \u2192 10 components",
    details: [
      "StandardScaler normalization (zero mean, unit variance)",
      "Principal Component Analysis retaining 10 components",
      "Captures dominant variance patterns in permit language",
      "Backend: cuML PCA (GPU) with scikit-learn CPU fallback",
    ],
  },
  {
    icon: GitBranch,
    title: "5. KMeans Clustering",
    subtitle: "k=8 clusters, 300 max iterations",
    details: [
      "Lloyd\u2019s KMeans via cuML (GPU) or scikit-learn (CPU fallback)",
      "k=8 chosen to balance granularity vs interpretability",
      "Rule-based cluster naming from keyword prevalence",
      "Result: 8 human-readable categories covering all 2.34M permits",
    ],
  },
  {
    icon: Globe,
    title: "6. Supabase Upload",
    subtitle: "Structured tables for real-time queries",
    details: [
      "Aggregated stats uploaded to Supabase Postgres (cloud)",
      "Tables: clusters, cluster_keywords, energy_stats_by_zip",
      "Energy signal extraction: solar, battery, EV charger, generator permits",
      "PostgREST API with RPC functions for sub-500ms queries",
    ],
  },
  {
    icon: MessageSquare,
    title: "7. On-Device LLM",
    subtitle: "Llama 3.2 3B via Ollama on Jetson",
    details: [
      "Intent detection routes questions to relevant data slices",
      "Supabase query results passed as LLM context",
      "GPU-accelerated inference (~1.3s response time)",
      "No cloud API calls \u2014 fully on-device generation",
    ],
  },
  {
    icon: Map,
    title: "8. Frontend & Visualization",
    subtitle: "Next.js 16 + Mapbox GL + SSE streaming",
    details: [
      "Interactive map with 50K+ geocoded points, filterable by ZIP and energy type",
      "Story Builder: choose storylines, explore floating questions, build data narratives",
      "Server-Sent Events stream LLM responses with tool-call debug panel",
      "Served directly from Jetson AGX Orin over local network",
    ],
  },
];

// Visual flow stages for the diagram
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

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <p className="text-purple-400 text-sm uppercase tracking-widest mb-2">End-to-End Pipeline</p>
          <h1 className="text-4xl font-bold mb-4">From Raw Permits to Insights</h1>
          <p className="text-white/50 text-lg">
            2.34M construction permits flow through GPU-accelerated NLP, unsupervised clustering,
            Supabase storage, and on-device LLM &mdash; all running on NVIDIA Jetson AGX Orin.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="mb-16">
          <div className="space-y-4">
            {FLOW_STAGES.map((stage, si) => (
              <div key={si}>
                {/* Stage */}
                <div className={`rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-6`}>
                  {/* Stage label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`h-px flex-1 bg-gradient-to-r ${stage.color} opacity-30`} />
                    <span className={`text-xs font-bold tracking-[0.3em] ${stage.textColor} uppercase`}>{stage.label}</span>
                    <div className={`h-px flex-1 bg-gradient-to-l ${stage.color} opacity-30`} />
                  </div>

                  {/* Stage items in a row */}
                  <div className="grid grid-cols-3 gap-4">
                    {stage.items.map((item, ii) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={ii}
                          className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col items-center text-center gap-2"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-white font-semibold text-sm">{item.name}</div>
                          <div className="text-white/40 text-xs">{item.detail}</div>
                        </div>
                      );
                    })}
                    {/* Fill empty grid cells for 2-item rows */}
                    {stage.items.length === 2 && (
                      <div className="hidden md:block" />
                    )}
                  </div>
                </div>

                {/* Arrow between stages */}
                {si < FLOW_STAGES.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="w-5 h-5 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom badge */}
          <div className="flex justify-center mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>All running on NVIDIA Jetson AGX Orin (64GB)</span>
            </div>
          </div>
        </div>

        {/* Detailed Pipeline steps */}
        <h2 className="text-2xl font-bold mb-6">Pipeline Details</h2>
        <div className="space-y-6 mb-16">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-white/40 text-sm mb-3">{step.subtitle}</p>
                    <ul className="space-y-1.5">
                      {step.details.map((detail, j) => (
                        <li key={j} className="text-white/60 text-sm flex gap-2">
                          <span className="text-purple-400/60 mt-1 flex-shrink-0">&bull;</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cluster results */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Cluster Results</h2>
          <div className="space-y-3">
            {CLUSTERS.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-white/30 text-sm">{c.count.toLocaleString()} permits ({c.pct}%)</span>
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {c.keywords.map((kw, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct * (100 / 31)}%`, backgroundColor: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Hardware & Stack</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/30 mb-1">Compute</p>
              <p className="text-white/70">NVIDIA Jetson AGX Orin (64GB)</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">GPU Libraries</p>
              <p className="text-white/70">cuDF, cuML (RAPIDS)</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">ML Pipeline</p>
              <p className="text-white/70">StandardScaler &rarr; PCA &rarr; KMeans</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">Local LLM</p>
              <p className="text-white/70">Llama 3.2 3B via Ollama</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">Database</p>
              <p className="text-white/70">Supabase Postgres (cloud)</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">Frontend</p>
              <p className="text-white/70">Next.js 16 + Mapbox GL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
