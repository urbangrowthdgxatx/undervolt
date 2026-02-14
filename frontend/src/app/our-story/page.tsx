"use client";

import Image from "next/image";
import { ArrowRight, Zap } from "lucide-react";

const milestones = [
  {
    date: "Dec 2025",
    title: "Won 1st Place Urban Growth, NVIDIA DGX Hackathon",
    desc: "Built prototype on DGX Spark \u2014 processed 2.34M Austin building permits with GPU-accelerated NLP in under 48 hours.",
    current: false,
    logos: [
      { src: "/nvidia-icon.svg", alt: "NVIDIA", href: "https://www.nvidia.com/en-us/ai-data-science/products/dgx-spark/" },
    ],
  },
  {
    date: "Jan 2026",
    title: "Ported to Jetson AGX Orin",
    desc: "Moved the full pipeline to edge hardware. On-device inference with Ollama serving Llama 3.2 \u2014 no cloud dependency.",
    current: false,
    logos: [
      { src: "/nvidia-icon.svg", alt: "Jetson", href: "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/" },
      { src: "/ollama.png", alt: "Ollama", href: "https://ollama.com" },
    ],
  },
  {
    date: "Jan 2026",
    title: "Upgraded to Nemotron 3 Nano",
    desc: "Switched to NVIDIA\u2019s 30B MoE model (only 3B active params). Better accuracy on permit categorization, still running fully on-device via Ollama.",
    current: false,
    logos: [
      { src: "/nvidia-icon.svg", alt: "Nemotron", href: "https://build.nvidia.com/nvidia/nemotron-3-nano-30b-a3b" },
      { src: "/ollama.png", alt: "Ollama", href: "https://ollama.com" },
    ],
  },
  {
    date: "Feb 2026",
    title: "Launched Public Beta",
    desc: "Deployed to Vercel with Supabase backend. 96 pre-cached AI insights, interactive story mode, and real-time map exploration.",
    current: true,
    logos: [
      { src: "/vercel.svg", alt: "Vercel", href: "https://vercel.com" },
      { src: "/supabase.svg", alt: "Supabase", href: "https://supabase.com" },
    ],
  },
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4">From hackathon to production</h1>
            <p className="text-white/40 mt-3">How we scaled from a weekend prototype to a live analytics platform</p>
          </div>

          {/* Origin */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-white/10 mb-16">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-white">How It Started</span>
            </div>
            <p className="text-white/70 text-sm mb-3">
              At the NVIDIA DGX Spark Frontier Hackathon in Austin, our team set out to answer one question: <em className="text-white">What could cities learn if their massive open datasets were finally explorable in real time?</em>
            </p>
            <p className="text-white/50 text-sm mb-3">
              Using Austin&apos;s 2.34M construction permits, we built Undervolt &mdash; transforming messy, unstructured public data into real-time Urban Growth Intelligence.
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

          {/* Timeline */}
          <div className="relative pl-8">
            {/* Vertical line — centered on the dots */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />

            <div className="space-y-10">
              {milestones.map((m, i) => (
                <div key={i} className="relative">
                  {/* Dot — 22px ring centered on the line */}
                  <div
                    className={`absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                      m.current
                        ? "border-emerald-400 bg-black"
                        : "border-emerald-500/60 bg-black"
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        m.current ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">{m.date}</span>
                    <h3 className="text-white font-semibold mt-1 leading-snug">{m.title}</h3>
                    <p className="text-white/50 text-sm mt-1.5">{m.desc}</p>

                    {/* Logo pills */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {m.logos.map((logo) => (
                        <a
                          key={logo.alt}
                          href={logo.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            width={14}
                            height={14}
                            className="opacity-60"
                          />
                          <span className="text-xs text-white/50">{logo.alt}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
