"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Database, Brain, Map, AlertTriangle, TrendingUp, Battery, Sun, Loader2, Check, ChevronLeft, ChevronRight, Building2, Lightbulb, HardHat, Plug, Server, BarChart3, Car, Cpu, Cloud, Workflow } from "lucide-react";

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

  // Auto-rotate cards (8 seconds)
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
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Undervolt
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/50 mb-4 font-light">
            Urban Growth Intelligence for Austin
          </p>

          <p className="text-lg text-white/30 max-w-2xl mx-auto mb-12 leading-relaxed">
            GPU-accelerated analytics extract hidden infrastructure signals from{" "}
            <span className="text-white/60 font-medium">2.3 million construction permits</span>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-all"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-full font-medium hover:bg-white/15 transition-all border border-white/10"
            >
              Learn More
            </Link>
          </div>

          {/* Award Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-8">
            <span>🏆</span>
            <span>1st Place Urban Growth - NVIDIA DGX Spark Hackathon</span>
          </div>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 mx-auto flex justify-center pt-2">
              <div className="w-1 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Problem Section - Rotating Cards */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-amber-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400/80 text-sm font-medium tracking-wide uppercase">Infrastructure Signals</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Austin is Changing Fast</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Solar panels, EV chargers, and generators are spreading rapidly.
              Inside 2.3 million permits, a fragile reality is hiding.
            </p>
          </div>

          {/* Rotating Card Display */}
          <div className="relative bg-white/[0.02] rounded-3xl border border-white/[0.06] p-8 md:p-12">
            <div className="flex items-center justify-center gap-6 md:gap-10">
              {/* Previous button */}
              <button
                onClick={() => setActiveCard((prev) => (prev - 1 + resilienceCards.length) % resilienceCards.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/50" />
              </button>

              {/* Card Content */}
              <Link
                href={resilienceCards[activeCard].href}
                className="flex-1 text-center group max-w-md"
              >
                <div className={`text-5xl md:text-6xl font-bold mb-5 transition-all ${
                  resilienceCards[activeCard].color === 'amber' ? 'text-amber-400' :
                  resilienceCards[activeCard].color === 'red' ? 'text-red-400' :
                  resilienceCards[activeCard].color === 'yellow' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {resilienceCards[activeCard].stat}
                </div>
                <p className="text-white/50 text-base mb-4 leading-relaxed">
                  {resilienceCards[activeCard].description}
                </p>
                <span className="inline-flex items-center gap-2 text-sm text-white/40 group-hover:text-white/60 transition-colors">
                  {resilienceCards[activeCard].cta}
                </span>
              </Link>

              {/* Next button */}
              <button
                onClick={() => setActiveCard((prev) => (prev + 1) % resilienceCards.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {resilienceCards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCard(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeCard ? 'bg-white/50 w-6' : 'bg-white/15 w-1.5 hover:bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      {/* The Divide - Equity Story */}
      <section className="py-24 px-6 bg-gradient-to-b from-amber-950/20 via-blue-950/30 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <span className="text-blue-400/80 text-sm font-medium tracking-wide uppercase">The Divide</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-4">Not Everyone is Preparing the Same</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              After the 2021 freeze, wealthier neighborhoods added backup power. Others couldn't.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="text-center p-8 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-white/40 text-sm mb-3">District 10 (Westlake)</p>
              <div className="text-5xl font-bold text-blue-400 mb-2">2,151</div>
              <p className="text-white/40 text-sm">generators since 2021</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-white/40 text-sm mb-3">East Austin</p>
              <div className="text-5xl font-bold text-white/40 mb-2">175</div>
              <p className="text-white/40 text-sm">generators since 2021</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/dashboard?filter=generator" className="inline-flex items-center gap-2 text-blue-400/70 hover:text-blue-400 text-sm transition-colors">
              Explore the data yourself
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      {/* Stats Section - Clickable */}
      <section className="py-24 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <span className="text-purple-400/80 text-sm font-medium tracking-wide uppercase">Live Data</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-3">Explore by Category</h2>
            <p className="text-white/40 text-sm">Click any stat to filter on the map</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <Link href="/dashboard" className="text-center p-5 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all group">
              <Database className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">2.3M</div>
              <div className="text-xs text-white/40">Total Permits</div>
            </Link>
            <Link href="/dashboard?filter=solar" className="text-center p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/30 hover:bg-yellow-500/10 transition-all group">
              <Sun className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">25,982</div>
              <div className="text-xs text-white/40">Solar</div>
            </Link>
            <Link href="/dashboard?filter=generator" className="text-center p-5 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all group">
              <Zap className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">7,248</div>
              <div className="text-xs text-white/40">Generators</div>
            </Link>
            <Link href="/dashboard?filter=battery" className="text-center p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all group">
              <Battery className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">1,161</div>
              <div className="text-xs text-white/40">Batteries</div>
            </Link>
            <Link href="/dashboard?filter=ev_charger" className="text-center p-5 rounded-xl bg-green-500/5 border border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10 transition-all group col-span-2 md:col-span-1">
              <Car className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">3,642</div>
              <div className="text-xs text-white/40">EV Chargers</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Who Is This For */}
      <section className="py-24 px-6 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-white/40 text-sm font-medium tracking-wide uppercase">Use Cases</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-3">Who Is This For?</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Turn permit data into actionable intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">City Planners</h3>
              <p className="text-white/40 text-sm">Identify where to invest in grid infrastructure before stress hits</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Energy Companies</h3>
              <p className="text-white/40 text-sm">Find solar and battery gaps - know where to sell before competitors</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <HardHat className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Developers</h3>
              <p className="text-white/40 text-sm">Spot infrastructure-ready zones and growth corridors early</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Plug className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Utilities</h3>
              <p className="text-white/40 text-sm">Load forecasting by neighborhood with permit-level granularity</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Server className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Datacenter Scouts</h3>
              <p className="text-white/40 text-sm">Assess if an area is grid-ready before committing to a site</p>
            </div>
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Analysts</h3>
              <p className="text-white/40 text-sm">Query millions of records in milliseconds with natural language</p>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-24 bg-gradient-to-b from-black to-purple-950/30" />

      {/* How It Works */}
      <section className="py-24 px-6 bg-purple-950/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="text-purple-400/80 text-sm font-medium tracking-wide uppercase">Technology</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-3">How It Works</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              GPU-accelerated pipeline transforms raw permit data into urban intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-blue-400 text-xs font-medium mb-4">01 — DATA</div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Ingest & Clean</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                2.3M permits from Austin Open Data, cleaned with GPU-accelerated cuDF
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-purple-400 text-xs font-medium mb-4">02 — ML</div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Cluster & Classify</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                NLP extraction, PCA reduction, and KMeans clustering into 8 categories
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-green-400 text-xs font-medium mb-4">03 — SERVE</div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Map className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Visualize & Explore</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Interactive maps, trend analysis, and on-device LLM queries
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/about"
              className="text-white/30 hover:text-white/50 text-sm flex items-center gap-2 transition-colors"
            >
              View technical details
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-24 bg-gradient-to-b from-purple-950/30 to-green-950/20" />

      {/* From Cloud to Edge */}
      <section className="py-24 px-6 bg-gradient-to-b from-green-950/20 to-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="text-green-400/80 text-sm font-medium tracking-wide uppercase">The Journey</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 mb-3">From Cloud to Edge</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Built on datacenter hardware, deployed to edge devices
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* DGX Spark */}
            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">NVIDIA DGX Spark</h3>
                  <p className="text-white/40 text-xs">Training & Development</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>GPU-accelerated data processing with cuDF</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>ML pipeline: TF-IDF, PCA, KMeans clustering</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>2.3M permits processed and classified</span>
                </li>
              </ul>
            </div>

            {/* AGX Orin */}
            <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Jetson AGX Orin 64GB</h3>
                  <p className="text-white/40 text-xs">Production Deployment</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Nemotron Mini 4B via Ollama</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Zero cloud dependency, data stays local</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Real-time queries on edge hardware</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-8 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
              <span className="text-white/20">Stack:</span>
              <span>RAPIDS cuDF</span>
              <span className="text-white/20">•</span>
              <span>scikit-learn</span>
              <span className="text-white/20">•</span>
              <span>Nemotron</span>
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
      <div className="h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      {/* CTA Section */}
      <section className="py-24 px-6 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Start Exploring
          </h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto text-sm">
            Discover hidden patterns in Austin's urban infrastructure
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all text-sm"
            >
              <Map className="w-4 h-4" />
              Start Exploring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black to-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-xl font-semibold text-white mb-2">The Team</h3>
            <p className="text-white/40 text-sm">Connect with us on LinkedIn</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="https://www.linkedin.com/in/jravinder" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-center transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">RJ</span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Ravinder Jilkapally</div>
              <div className="text-white/40 text-xs">AI Product Leader</div>
            </a>
            <a href="https://www.linkedin.com/in/avanishj" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-center transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">AJ</span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Avanish Joshi</div>
              <div className="text-white/40 text-xs">Data & Analytics</div>
            </a>
            <a href="https://www.linkedin.com/in/tyroneavnit/" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 text-center transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">TA</span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Tyrone Avnit</div>
              <div className="text-white/40 text-xs">Full Stack Engineer</div>
            </a>
            <a href="https://www.linkedin.com/in/siddharthgargava/" target="_blank" rel="noopener noreferrer" className="group p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-center transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">SG</span>
              </div>
              <div className="text-white font-medium text-sm mb-1">Siddharth Gargava</div>
              <div className="text-white/40 text-xs">ML Engineer</div>
            </a>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Contact Form */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-950 to-purple-950/30" id="contact">
        <div className="max-w-xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-3 text-center">Interested in applying this to your data?</h3>
            <p className="text-white/50 text-sm mb-6 text-center">
              We can help you build similar intelligence layers for your city, organization, or dataset.
            </p>

            {formState === "success" ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium mb-2">Message sent!</p>
                <p className="text-white/50 text-sm">We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Company / Organization"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="How can we help?"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {formState === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {formState === "error" && (
                  <p className="text-red-400 text-sm text-center">Something went wrong. Please email us directly.</p>
                )}
              </form>
            )}
            <p className="text-white/30 text-xs mt-4 text-center">Or email directly: undervolt-team@aisoft.us</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Hackathon Credits */}
      <section className="py-16 px-6 bg-gradient-to-b from-purple-950/30 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-sm mb-6">
            <span>🏆</span>
            <span>1st Place Urban Growth Track | 3rd Overall</span>
          </div>
          <p className="text-white/40 text-sm mb-2">
            Originally trained on{" "}
            <span className="text-white/60">NVIDIA DGX Spark</span>
            {" "}at the{" "}
            <a href="https://lu.ma/aitxhackathon" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2">
              NVIDIA DGX Spark Frontier Hackathon
            </a>
            , Austin 2024
          </p>
          <p className="text-white/30 text-sm mb-6">
            Now deployed on{" "}
            <span className="text-green-400/70">NVIDIA Jetson AGX Orin 64GB</span>
          </p>
          <p className="text-white/30 text-xs mb-4">Hackathon Sponsors</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <a href="https://nvidia.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">NVIDIA</a>
            <span className="text-white/20">•</span>
            <a href="https://aitx.community" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">AITX Community</a>
            <span className="text-white/20">•</span>
            <a href="https://asus.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">ASUS</a>
            <span className="text-white/20">•</span>
            <a href="https://arm.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">Arm</a>
            <span className="text-white/20">•</span>
            <a href="https://antler.co" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">Antler</a>
          </div>
        </div>
      </section>

    </div>
  );
}
