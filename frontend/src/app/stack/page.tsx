"use client";

import { Cpu, Cloud, Database, Brain, Globe, Server, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const HARDWARE = [
  {
    name: "NVIDIA DGX Spark",
    role: "Training & Development",
    description: "GPU-accelerated ML pipeline development. Batch processing of 2.3M permit records with RAPIDS cuDF.",
    color: "purple",
    icon: Cloud,
  },
  {
    name: "NVIDIA Jetson AGX Orin 64GB",
    role: "Production Deployment",
    description: "Edge inference with 275 TOPS. Runs the full stack locally with zero cloud dependency.",
    color: "green",
    icon: Cpu,
  },
];

const SOFTWARE = [
  {
    name: "Nemotron Mini 4B",
    category: "LLM",
    description: "NVIDIA's instruction-tuned model for natural language queries on permit data.",
    link: "https://nvidia.com",
  },
  {
    name: "Ollama",
    category: "LLM Serving",
    description: "Local model serving framework. Enables on-device inference without cloud APIs.",
    link: "https://ollama.com",
  },
  {
    name: "RAPIDS cuDF",
    category: "Data Processing",
    description: "GPU DataFrame library for pandas-like operations at GPU speed.",
    link: "https://rapids.ai",
  },
  {
    name: "scikit-learn",
    category: "ML Pipeline",
    description: "TF-IDF vectorization, PCA dimensionality reduction, KMeans clustering.",
    link: "https://scikit-learn.org",
  },
  {
    name: "Next.js",
    category: "Frontend",
    description: "React framework with server components and API routes.",
    link: "https://nextjs.org",
  },
  {
    name: "Leaflet",
    category: "Mapping",
    description: "Interactive maps with cluster visualization and permit overlays.",
    link: "https://leafletjs.com",
  },
  {
    name: "Supabase",
    category: "Database",
    description: "PostgreSQL database for permit storage and real-time queries.",
    link: "https://supabase.com",
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    description: "Utility-first CSS framework for rapid UI development.",
    link: "https://tailwindcss.com",
  },
];

const PIPELINE = [
  { step: "01", label: "Ingest", description: "Austin Open Data API → Raw permits" },
  { step: "02", label: "Clean", description: "cuDF normalization, deduplication" },
  { step: "03", label: "Extract", description: "TF-IDF on permit descriptions" },
  { step: "04", label: "Reduce", description: "PCA to 50 components" },
  { step: "05", label: "Cluster", description: "KMeans into 8 categories" },
  { step: "06", label: "Serve", description: "API + LLM + Interactive maps" },
];

export default function StackPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Tech Stack</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Built on NVIDIA hardware, powered by open source software.
            From datacenter to edge deployment.
          </p>
        </div>

        {/* Hardware Section */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 text-white/80">Hardware</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {HARDWARE.map((item) => {
              const Icon = item.icon;
              const colorClasses = item.color === "purple"
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                : "bg-green-500/10 border-green-500/20 text-green-400";
              return (
                <div
                  key={item.name}
                  className={`p-6 rounded-xl border ${colorClasses.split(" ").slice(0, 2).join(" ")}`}
                >
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

        {/* Pipeline Section */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 text-white/80">ML Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE.map((item, i) => (
              <div key={item.step} className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                <div className="text-white/30 text-xs mb-2">{item.step}</div>
                <div className="text-white font-medium text-sm mb-1">{item.label}</div>
                <div className="text-white/40 text-xs">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Software Section */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 text-white/80">Software</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SOFTWARE.map((item) => (
              <a
                key={item.name}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">{item.category}</span>
                    </div>
                    <p className="text-white/40 text-sm">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 text-white/80">Built With Support From</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 py-8 px-6 rounded-xl bg-white/[0.02] border border-white/5">
            <a href="https://nvidia.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors font-medium">NVIDIA</a>
            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors font-medium">Ollama</a>
            <a href="https://aitx.community" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors font-medium">AITX Community</a>
            <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors font-medium">Hugging Face</a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-white/40 text-sm mb-6">
            Want to build something similar?
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
