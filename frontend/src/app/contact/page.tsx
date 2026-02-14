"use client";

import { useState } from "react";
import { Send, Github, Mail, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("sent");
        trackEvent("contact_form_submit");
        setForm({ name: "", email: "", company: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">Contact</span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4">Get in touch</h1>
            <p className="text-white/40 mt-3">Questions, feedback, or partnership inquiries</p>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <a
              href="mailto:undervolt-team@aisoft.us"
              className="flex items-center gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Email</h3>
                <p className="text-white/50 text-sm">undervolt-team@aisoft.us</p>
              </div>
            </a>
            <a
              href="https://github.com/urbangrowthdgxatx/undervolt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Github className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-white font-medium">GitHub</h3>
                <p className="text-white/50 text-sm">Open issues & discussions</p>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          {status === "sent" ? (
            <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Message sent</h3>
              <p className="text-white/50 text-sm">We&apos;ll get back to you soon.</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Send another message <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm text-white/60 mb-2">Name *</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-white/60 mb-2">Email *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm text-white/60 mb-2">Company</label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm text-white/60 mb-2">Message *</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none transition-colors text-sm resize-none"
                  placeholder="How can we help?"
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm">Something went wrong. Please try again or email us directly.</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-lg font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                {status === "sending" ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
