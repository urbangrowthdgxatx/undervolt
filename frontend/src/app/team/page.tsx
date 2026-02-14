"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

const TEAM = [
  {
    name: "Ravinder Jilkapally",
    role: "Product & Engineering Lead",
    tagline: "Scaling AI at Xpanse",
    focus: "Product, Platform, and Engineering leader with 18+ years building large scale AI/ML platforms, GenAI products, and cloud native data systems. 0\u21921 execution, multi-tenant AI architecture, scaling teams from prototype to production.",
    linkedin: "https://linkedin.com/in/jravinder",
    avatar: "https://www.gravatar.com/avatar/07e9975093e352d88e8a43b95bbf3295?s=200",
  },
];

const HACKATHON_TEAM = [
  { name: "Tyrone Avnit", role: "Applied AI Engineer @ Civic", linkedin: "https://linkedin.com/in/tyroneavnit", avatar: "https://www.gravatar.com/avatar/2d91bf6a5069a39550bb7def3908500d?s=100" },
  { name: "Avanish Joshi", role: "Sr. Integration Architect @ Cepheid", linkedin: "https://linkedin.com/in/avanishj", avatar: "https://www.gravatar.com/avatar/e86d5d8cf4f6bddaf0615a45ec2dbde5?s=100" },
  { name: "Siddharth Gargava", role: "SDE-II @ AWS", linkedin: "https://linkedin.com/in/siddharthgargava", avatar: "https://www.gravatar.com/avatar/909de212a76ee4102373f34ba14ab4f5?s=100" },
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Team</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4">The people behind Undervolt</h1>
            <p className="text-white/40 mt-3">From hackathon prototype to production platform</p>
          </div>

          {/* Project Lead */}
          <div className="mb-12">
            <h3 className="text-sm text-white/60 uppercase tracking-wider mb-6">Lead</h3>
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="flex flex-col sm:flex-row items-center gap-6 p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/5 border border-amber-500/20"
              >
                {member.avatar && (
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
                    <img src={member.avatar} alt={member.name} className="relative w-24 h-24 rounded-full border-3 border-amber-500/40" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
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

          {/* Hackathon Contributors */}
          <div className="mb-12">
            <h3 className="text-sm text-white/60 uppercase tracking-wider mb-4">Hackathon Contributors</h3>
            <p className="text-white/50 text-sm mb-6">Special thanks to the team that helped build the initial prototype at the NVIDIA DGX Spark Frontier Hackathon.</p>
            <div className="grid sm:grid-cols-3 gap-3">
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
                    <p className="text-white/30 text-xs mt-1 group-hover:text-white/50 transition-colors">LinkedIn &rarr;</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-white/50 text-sm mb-4">Want to contribute or have questions?</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-lg font-medium hover:bg-emerald-400 transition-all text-sm"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://github.com/urbangrowthdgxatx/undervolt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white/60 border border-white/10 rounded-lg font-medium hover:border-white/20 transition-all text-sm"
              >
                View on GitHub
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
