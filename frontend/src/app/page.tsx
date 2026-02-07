"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Github, AlertTriangle, Check, ChevronLeft, ChevronRight, Cloud, Cpu, Database, ExternalLink, Map, Zap, BarChart3, Loader2 } from "lucide-react";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function HomePage() {
  const [activeCard, setActiveCard] = useState(0);
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });
  const [dataDate, setDataDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        if (data.dateRange?.latest) {
          setDataDate(new Date(data.dateRange.latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
        }
      })
      .catch(() => {});
  }, []);

  const resilienceCards = [
    {
      href: "/dashboard?filter=battery",
      stat: "22:1",
      color: "amber",
      description: "Solar to battery ratio. The city produces clean energy but cannot store it.",
      cta: "Explore battery gap →"
    },
    {
      href: "/dashboard?filter=generator",
      stat: "+246%",
      color: "red",
      description: "Generator permits after the 2021 freeze. Grid trust is broken.",
      cta: "See generator surge →"
    },
    {
      href: "/dashboard?filter=solar",
      stat: "25,982",
      color: "yellow",
      description: "Solar installations tracking clean energy adoption across neighborhoods.",
      cta: "View solar map →"
    },
    {
      href: "/dashboard?filter=ev_charger",
      stat: "3,642",
      color: "green",
      description: "EV chargers installed. Infrastructure racing to keep up with adoption.",
      cta: "Explore EV infrastructure →"
    }
  ];
  
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % resilienceCards.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [resilienceCards.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormState("success");
        setFormData({ name: "", email: "", company: "", message: "" });
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
            {/* Hero Section - Black */}
      <section className="relative min-h-screen flex flex-col">

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              {/* Logo Icon - Amber/Gold bolt */}
              <svg className="w-14 h-14 md:w-20 md:h-20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#bolt-gradient)" />
                <defs>
                  <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                <span className="text-white">under</span><span className="text-amber-400">volt</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/60 mb-4">
              Analyzing <span className="text-white font-medium">2.34M Austin construction permits</span>
            </p>
            {/* Tech Stack - Icons with labels */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* NVIDIA */}
              <div className="flex flex-col items-center gap-1">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#76B900"><path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.412 0-.807-.063-1.167-.18v-4.475c1.224.164 1.472.768 2.209 2.063l1.722-1.465s-1.373-1.842-3.506-1.842c-.147 0-.287.009-.425.023v-.001zm0-4.762v2.06l.424-.036c5.136-.189 8.508 4.256 8.508 4.256s-3.898 4.823-7.283 4.823a5.5 5.5 0 0 1-1.649-.251v1.345a6.9 6.9 0 0 0 1.423.153c4.834 0 8.291-2.867 10.579-4.971.306.262 1.561 1.064 1.818 1.393-2.163 1.78-7.239 4.853-12.319 4.853a9.3 9.3 0 0 1-1.501-.122v1.453h14.039V4.036H8.948zm0 10.327v1.146a5.5 5.5 0 0 1-1.167-.251V8.632c.377-.095.774-.153 1.167-.169v.335c-2.052.163-3.478 2.159-3.478 2.159s1.18 2.406 3.478 3.406z"/></svg>
                <span className="text-[10px] text-white/40">NVIDIA</span>
              </div>
              {/* Ollama */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🦙</span>
                <span className="text-[10px] text-white/40">Ollama</span>
              </div>
              {/* Nemotron */}
              <div className="flex flex-col items-center gap-1">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#76B900"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                <span className="text-[10px] text-white/40">Nemotron</span>
              </div>
              {/* Jetson */}
              <div className="flex flex-col items-center gap-1">
                <Cpu className="w-8 h-8 text-[#76B900]" />
                <span className="text-[10px] text-white/40">Jetson</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-8">
              <Link
                href="/explore"
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors"
              >
                <Map className="w-4 h-4" />
                Explore
              </Link>
              <Link
                href="/story"
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/30 rounded-lg font-medium transition-colors"
              >
                <Zap className="w-4 h-4" />
                Ask AI
              </Link>
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-colors"
                title="View on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-8 py-6 text-sm text-white/40">
          <span>• Live on Jetson AGX Orin</span>
          <span>• NVIDIA RAPIDS Accelerated</span>
          <span>© 2025 Undervolt Project</span>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Problem Section - Dark Gray */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left - Headline */}
            <div>
              <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-4 block">The Problem</span>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Infrastructure signals are hiding in{" "}
                <span className="text-white/40">plain sight.</span>
              </h2>
            </div>

            {/* Right - Points */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">The Permitting Bottleneck</h3>
                  <p className="text-white/50">Manual analysis of Austin's construction data is slow, fragmented, and prone to human error.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Hidden Trends</h3>
                  <p className="text-white/50">Critical infrastructure trends are buried under a mountain of bureaucratic paperwork and legacy PDF formats.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">The 2.3M Scale Challenge</h3>
                  <p className="text-white/50">Processing <span className="text-white">2.34 million permits</span> manually is an impossible task for urban planners and developers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />


      {/* Built For Section */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Who is this for</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4">Built for decision makers</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">🏛️</div>
              <h3 className="font-semibold text-lg mb-2">City Planners</h3>
              <p className="text-white/50 text-sm">Identify infrastructure gaps, track permit trends, and make data-driven zoning decisions.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Energy Companies</h3>
              <p className="text-white/50 text-sm">Find underserved areas for solar, battery, and EV infrastructure investments.</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="text-2xl mb-3">🔬</div>
              <h3 className="font-semibold text-lg mb-2">Researchers</h3>
              <p className="text-white/50 text-sm">Analyze urban growth patterns, climate resilience, and infrastructure equity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />
      {/* Live Stats Section - Black */}
      <section className="py-24 px-8 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Performance Benchmarks</span>
            <h2 className="text-4xl font-bold mt-4">Live Stats</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/dashboard" className="group p-8 rounded-xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/50 transition-all">
              <Database className="w-6 h-6 text-emerald-400 mb-4" />
              <div className="text-5xl font-bold mb-2">2.3<span className="text-2xl text-white/40">M</span></div>
              <div className="text-white/60 font-medium">Permits Processed</div>
              <div className="text-white/40 text-sm mt-2">Real-time Austin database synchronization</div>
            </Link>

            <Link href="/dashboard" className="group p-8 rounded-xl bg-white/[0.02] border border-white/10 hover:border-blue-500/50 transition-all">
              <Zap className="w-6 h-6 text-blue-400 mb-4" />
              <div className="text-5xl font-bold mb-2">80<span className="text-2xl text-white/40">ms</span></div>
              <div className="text-white/60 font-medium">Query Speed</div>
              <div className="text-white/40 text-sm mt-2">Sub-second spatial analysis execution</div>
            </Link>

            <Link href="/dashboard" className="group p-8 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/50 transition-all">
              <Map className="w-6 h-6 text-cyan-400 mb-4" />
              <div className="text-5xl font-bold mb-2">4.2<span className="text-2xl text-white/40">GB</span></div>
              <div className="text-white/60 font-medium">GeoJSON Output</div>
              <div className="text-white/40 text-sm mt-2">Aggregated spatial data structure</div>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-white/40">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            System Status: Optimal
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Infrastructure Signals - Dark Gray */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">Infrastructure Signals</span>
            <h2 className="text-4xl font-bold mt-4 mb-4">Austin is Changing Fast</h2>
            <p className="text-white/50 text-lg">
              Solar panels, EV chargers, and generators are spreading rapidly.
            </p>
          </div>

          {/* Rotating Card */}
          <div className="relative bg-white/[0.02] rounded-2xl border border-white/10 p-10 md:p-14">
            <div className="flex items-center justify-center gap-8 md:gap-12">
              <button
                onClick={() => setActiveCard((prev) => (prev - 1 + resilienceCards.length) % resilienceCards.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/50" />
              </button>

              <Link
                href={resilienceCards[activeCard].href}
                className="flex-1 text-center group max-w-md"
              >
                <div className={`text-6xl md:text-7xl font-bold mb-6 ${
                  resilienceCards[activeCard].color === 'amber' ? 'text-amber-400' :
                  resilienceCards[activeCard].color === 'red' ? 'text-red-400' :
                  resilienceCards[activeCard].color === 'yellow' ? 'text-yellow-400' :
                  'text-emerald-400'
                }`}>
                  {resilienceCards[activeCard].stat}
                </div>
                <p className="text-white/50 text-lg mb-5">
                  {resilienceCards[activeCard].description}
                </p>
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                  {resilienceCards[activeCard].cta}
                </span>
              </Link>

              <button
                onClick={() => setActiveCard((prev) => (prev + 1) % resilienceCards.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="flex justify-center gap-3 mt-10">
              {resilienceCards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCard(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeCard ? 'bg-white/50 w-8' : 'bg-white/15 w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* The Divide - Black */}
      <section className="py-24 px-8 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 text-sm font-medium tracking-wide uppercase">The Divide</span>
            <h2 className="text-4xl font-bold mt-4 mb-4">Not Everyone is Preparing the Same</h2>
            <p className="text-white/50 text-lg">
              After the 2021 freeze, wealthier neighborhoods added backup power. Others couldn't.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center p-10 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <p className="text-white/40 text-sm mb-4">District 10 (Westlake)</p>
              <div className="text-6xl font-bold text-blue-400 mb-3">2,151</div>
              <p className="text-white/40">generators since 2021</p>
            </div>
            <div className="text-center p-10 rounded-2xl bg-white/[0.02] border border-white/10">
              <p className="text-white/40 text-sm mb-4">East Austin</p>
              <div className="text-6xl font-bold text-white/30 mb-3">175</div>
              <p className="text-white/40">generators since 2021</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/dashboard?filter=generator" className="inline-flex items-center gap-2 text-blue-400/70 hover:text-blue-400 text-sm transition-colors">
              Explore the data yourself
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Technical Architecture - Dark Gray */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Technical Architecture</span>
            <h2 className="text-4xl font-bold mt-4 mb-4">How It Works</h2>
            <p className="text-white/50">GPU-accelerated pipeline from raw data to urban intelligence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-xl bg-black border border-white/10">
              <div className="text-blue-400 text-xs font-mono mb-4">01 / INGEST</div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-5">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Austin Open Data</h3>
              <p className="text-white/40 text-sm">2.34M permits ingested and cleaned with GPU-accelerated RAPIDS cuDF</p>
            </div>

            <div className="p-8 rounded-xl bg-black border border-white/10">
              <div className="text-emerald-400 text-xs font-mono mb-4">02 / PROCESS</div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">NVIDIA DGX Processing</h3>
              <p className="text-white/40 text-sm">TF-IDF vectorization, PCA reduction, and KMeans clustering on GPU</p>
            </div>

            <div className="p-8 rounded-xl bg-black border border-white/10">
              <div className="text-cyan-400 text-xs font-mono mb-4">03 / SERVE</div>
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-5">
                <Map className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Edge Deployment</h3>
              <p className="text-white/40 text-sm">Jetson AGX Orin serves real-time queries with on-device LLM</p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-10 p-5 rounded-lg bg-black border border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/40 font-mono">
              <span>RAPIDS cuDF</span>
              <span className="text-white/20">•</span>
              <span>scikit-learn</span>
              <span className="text-white/20">•</span>
              <span>Nemotron 4B</span>
              <span className="text-white/20">•</span>
              <span>Ollama</span>
              <span className="text-white/20">•</span>
              <span>Next.js</span>
              <span className="text-white/20">•</span>
              <span>Leaflet</span>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Cloud to Edge - Black */}
      <section className="py-24 px-8 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">The Journey</span>
            <h2 className="text-4xl font-bold mt-4 mb-4">From Cloud to Edge</h2>
            <p className="text-white/50">Trained on datacenter hardware, deployed to edge devices</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">NVIDIA DGX Spark</h3>
                  <p className="text-white/40 text-sm">Training & Development</p>
                </div>
              </div>
              <ul className="space-y-3 text-white/50 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  NVIDIA RAPIDS cuDF for GPU data processing
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  Ollama + NIM for local LLM inference
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  CUDA-accelerated ML: TF-IDF, PCA, KMeans
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  2.34M permits processed on DGX Spark
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Jetson AGX Orin 64GB</h3>
                  <p className="text-white/40 text-sm">Production Deployment</p>
                </div>
              </div>
              <ul className="space-y-3 text-white/50 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">•</span>
                  Nemotron Mini 4B via Ollama
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">•</span>
                  Zero cloud dependency, data stays local
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">•</span>
                  Real-time queries on edge hardware
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}


      {/* Contact Form - Black */}
      <section className="py-24 px-8 bg-black" id="contact">
        <div className="max-w-xl mx-auto">
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-2xl font-semibold mb-4 text-center">Want to collaborate?</h3>
            <p className="text-white/50 mb-8 text-center">
              Open to contributions, partnerships, and adapting for other cities.
            </p>

            {formState === "success" ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="font-medium text-lg mb-2">Message sent!</p>
                <p className="text-white/50">You'll hear back soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Company / Organization (optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="Your message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {formState === "loading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {formState === "error" && (
                  <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Open Source Call to Action */}
      <section className="py-16 px-8 bg-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-4">Open Source</h3>
          <p className="text-white/50 mb-6">
            Built for the community. MIT Licensed.
          </p>

          <div className="flex items-center justify-center gap-6 mb-8">
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
              View Repository
            </a>
            <a
              href="https://lu.ma/aitx-dgx-hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Hackathon Info
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm w-fit mx-auto mb-8">
            <span>🌵</span>
            <span>Made in Austin</span>
          </div>

          <div className="text-white/30 text-sm mb-4">
            🏆 <span className="text-amber-400 font-semibold">1st Place Winner</span> - Built on <span className="text-emerald-400">NVIDIA DGX Spark</span> at the{" "}
            <a href="https://lu.ma/aitx-dgx-hackathon" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-white underline underline-offset-2">
              NVIDIA AITX Frontier Hackathon
            </a>
          </div>

          <div className="text-white/30 text-sm mb-8">
            <span className="text-emerald-400">DGX Spark</span> → <span className="text-emerald-400/70">Jetson AGX Orin</span> Pipeline
          </div>

          <div className="text-white/30 text-sm mb-4">
            Data: <a href="https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white underline underline-offset-2">City of Austin Open Data</a> • {dataDate && <span>Updated through {dataDate} • </span>}Building, Electrical, Mechanical, Plumbing & Driveway Permits
          </div>

          <div className="text-white/20 text-xs">
            Hackathon Sponsors: NVIDIA • AITX Community • ASUS • Arm • Antler
          </div>
          
          <div className="text-white/20 text-[10px] mt-4">
            v{process.env.NEXT_PUBLIC_VERSION || "dev"} • {process.env.NEXT_PUBLIC_COMMIT?.slice(0, 7) || "local"}
          </div>
        </div>
      </section>

    </div>
  );
}
