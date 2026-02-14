"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Map, BarChart3, FileText, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

const FREE_FEATURES = [
  { icon: Map, label: "Interactive permit map", description: "Explore 2.34M permits across Austin" },
  { icon: BarChart3, label: "Energy dashboards", description: "Solar, battery, generator trends" },
  { icon: FileText, label: "Pre-built reports", description: "Neighborhood and ZIP-level analysis" },
  { icon: Zap, label: "AI-curated stories", description: "Pre-analyzed insights powered by Nemotron" },
];

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("undervolt_email")) {
        setAlreadySignedIn(true);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase.from("waitlist").upsert(
        [{ email, source: "signin_page" }],
        { onConflict: "email" }
      );
      if (dbError) throw dbError;

      fetch("/api/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: "waitlist", reason: "Sign-in page" }),
      }).catch(() => {});

      localStorage.setItem("undervolt_email", email);
      trackEvent("waitlist_signup", { source: "signin_page" });
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Left — Sign up form */}
          <div>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <div className="w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {alreadySignedIn ? "Welcome back" : "Join the Waitlist"}
                </h1>
                <p className="text-white/50 text-sm">
                  {alreadySignedIn
                    ? "You\u2019re on the waitlist. We\u2019ll notify you when approved."
                    : "Get early access to AI-powered permit analysis"}
                </p>
              </div>

              {success ? (
                <div className="py-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium text-sm">You&apos;re on the waitlist!</p>
                      <p className="text-white/50 text-xs mt-0.5">We&apos;ll let you know when you&apos;re in.</p>
                    </div>
                  </div>
                  <Link
                    href="/explore"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors text-sm"
                  >
                    Start Exploring
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : alreadySignedIn ? (
                <div className="space-y-3">
                  <Link
                    href="/explore"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors text-sm"
                  >
                    Go to Explore
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/story"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors text-sm"
                  >
                    Ask Undervolt
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    Join Waitlist
                  </button>

                  <p className="text-white/30 text-xs text-center">
                    We&apos;ll review your request and notify you when approved
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Right — What you get without signing up */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-6">
              Free for everyone
            </h2>

            <div className="space-y-4">
              {FREE_FEATURES.map(({ icon: Icon, label, description }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white/50" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{label}</h3>
                    <p className="text-white/40 text-sm">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-amber-400 text-sm font-medium mb-1">Waitlist unlocks</p>
              <p className="text-white/50 text-sm">
                Custom AI queries — ask anything about Austin&apos;s 2.34M construction permits. Powered by NVIDIA Nemotron running on edge hardware.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
