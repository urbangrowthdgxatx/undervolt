"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Database, Brain, Map, AlertTriangle, Battery, Sun, Loader2, Check, ChevronLeft, ChevronRight, Building2, Lightbulb, HardHat, Plug, Server, BarChart3, Car, Cpu, Cloud, Github, ExternalLink } from "lucide-react";

export default function HomePage() {
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });
  const [activeCard, setActiveCard] = useState(0);

  const resilienceCards = [
    {
      href: "/dashboard?filter=battery",
      stat: "22:1",
      color: "amber",
      description: "Solar to battery ratio. The city produces clean energy but can't store it.",
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
      description: "Solar installations tracking Austin's clean energy adoption across neighborhoods.",
      cta: "View solar map →"
    },
    {
      href: "/dashboard?filter=ev_charger",
      stat: "3,642",
      color: "green",
      description: "EV chargers installed. Infrastructure racing to keep up with electric vehicle adoption.",
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
    <div className="min-h-screen bg-black text-white">

      {/* Hero Section - Black */}
      <section className="relative min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-lg">UNDERVOLT</span>
            </div>
            {/* Award Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs">
              <span>🏆</span>
              <span>1st Place - DGX Spark Hackathon</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition-colors">Dashboard</Link>
            <Link href="/reports" className="text-white/60 hover:text-white text-sm transition-colors">Reports</Link>
            <Link href="/methodology" className="text-white/60 hover:text-white text-sm transition-colors">Methodology</Link>
            <Link href="/about" className="text-white/60 hover:text-white text-sm transition-colors">About</Link>
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl text-center">
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight mb-8">
              UNDERVOLT
            </h1>
            <p className="text-xl md:text-2xl text-white/60 mb-4">
              Analyzing <span className="text-white font-medium">2.3M Austin construction permits</span> with
            </p>
            <p className="text-xl md:text-2xl text-emerald-400 mb-12">
              NVIDIA GPU acceleration
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/30 rounded-lg font-medium transition-colors"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors"
              >
                Explore Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-8 py-6 text-sm text-white/40">
          <span>• Live on Jetson AGX Orin</span>
          <span>• NVIDIA RAPIDS Accelerated</span>
          <span>© 2026 Undervolt Project</span>
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
                  <p className="text-white/50">Processing <span className="text-white">2.3 million data points</span> manually is an impossible task for urban planners and developers.</p>
                </div>
              </div>
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
            <h2 className="text-4xl font-bold mt-4 mb-4">How We Built It</h2>
            <p className="text-white/50">GPU-accelerated pipeline from raw data to urban intelligence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-xl bg-black border border-white/10">
              <div className="text-blue-400 text-xs font-mono mb-4">01 / INGEST</div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-5">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Austin Open Data</h3>
              <p className="text-white/40 text-sm">2.3M permits ingested and cleaned with GPU-accelerated RAPIDS cuDF</p>
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
                  GPU-accelerated data processing with cuDF
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  ML pipeline: TF-IDF, PCA, KMeans clustering
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400">•</span>
                  2.3M permits processed and classified
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
      <div className="h-px bg-white/10" />

      {/* Team Section - Dark Gray */}
      <section className="py-24 px-8 bg-neutral-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-white/40 text-sm font-medium tracking-wide uppercase">The Team</span>
            <h2 className="text-3xl font-bold mt-4 mb-3">Built by</h2>
            <p className="text-white/50">Connect with us on LinkedIn</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <a href="https://www.linkedin.com/in/jravinder" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-xl bg-black border border-white/10 hover:border-blue-500/30 text-center transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">RJ</span>
              </div>
              <div className="font-medium mb-1">Ravinder Jilkapally</div>
              <div className="text-white/40 text-sm">AI Product Leader</div>
            </a>
            <a href="https://www.linkedin.com/in/avanishj" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-xl bg-black border border-white/10 hover:border-cyan-500/30 text-center transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">AJ</span>
              </div>
              <div className="font-medium mb-1">Avanish Joshi</div>
              <div className="text-white/40 text-sm">Data & Analytics</div>
            </a>
            <a href="https://www.linkedin.com/in/tyroneavnit/" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-xl bg-black border border-white/10 hover:border-emerald-500/30 text-center transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">TA</span>
              </div>
              <div className="font-medium mb-1">Tyrone Avnit</div>
              <div className="text-white/40 text-sm">Full Stack Engineer</div>
            </a>
            <a href="https://www.linkedin.com/in/siddharthgargava/" target="_blank" rel="noopener noreferrer" className="group p-6 rounded-xl bg-black border border-white/10 hover:border-amber-500/30 text-center transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-xl">SG</span>
              </div>
              <div className="font-medium mb-1">Siddharth Gargava</div>
              <div className="text-white/40 text-sm">ML Engineer</div>
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Contact Form - Black */}
      <section className="py-24 px-8 bg-black" id="contact">
        <div className="max-w-xl mx-auto">
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-2xl font-semibold mb-4 text-center">Want to collaborate?</h3>
            <p className="text-white/50 mb-8 text-center">
              We're open to contributions, partnerships, and adapting this for other cities.
            </p>

            {formState === "success" ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="font-medium text-lg mb-2">Message sent!</p>
                <p className="text-white/50">We'll get back to you soon.</p>
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
                  placeholder="How can we help?"
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

      {/* Footer - Dark Gray */}
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
              href="https://lu.ma/aitxhackathon"
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
            Originally trained on <span className="text-white/50">NVIDIA DGX Spark</span> at the{" "}
            <a href="https://lu.ma/aitxhackathon" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white underline underline-offset-2">
              NVIDIA DGX Spark Frontier Hackathon
            </a>
          </div>

          <div className="text-white/30 text-sm mb-8">
            Now deployed on <span className="text-emerald-400/70">NVIDIA Jetson AGX Orin 64GB</span>
          </div>

          <div className="text-white/20 text-xs">
            Hackathon Sponsors: NVIDIA • AITX Community • ASUS • Arm • Antler
          </div>
        </div>
      </section>

    </div>
  );
}
