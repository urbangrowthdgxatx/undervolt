"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const FAQ_ITEMS = [
  {
    question: "What is Undervolt?",
    answer:
      "Undervolt is a GPU-accelerated urban intelligence platform that analyzes 2.34 million construction permits from Austin's open data portal. It uses AI to surface trends in energy infrastructure — solar adoption, battery storage, generator installations, and more.",
  },
  {
    question: "What data does Undervolt use?",
    answer:
      "All data comes from the City of Austin Open Data Portal, specifically the Issued Construction Permits dataset. This is publicly available data under a public domain license. Undervolt is not affiliated with the City of Austin.",
  },
  {
    question: "Is Undervolt free to use?",
    answer:
      "Yes. The explore pages, maps, and reports are free and open to everyone. Custom AI queries (Ask Undervolt) require joining the waitlist so we can manage compute costs on our edge hardware.",
  },
  {
    question: "What is edge AI and why does it matter?",
    answer:
      "Edge AI means running AI models directly on local hardware instead of cloud servers. Undervolt runs on an NVIDIA Jetson AGX Orin, which means faster inference, lower costs, and full data sovereignty — your queries never leave our hardware.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "The permit dataset is refreshed periodically from the City of Austin portal. AI analysis and categorization runs on each update cycle using our GPU pipeline.",
  },
  {
    question: "What is the waitlist for?",
    answer:
      "The waitlist gates access to custom AI queries. Since inference runs on local hardware with limited capacity, we approve users gradually to ensure quality responses for everyone.",
  },
  {
    question: "How accurate are the AI insights?",
    answer:
      "Undervolt uses NVIDIA Nemotron to analyze permit text. While the AI is highly capable, insights are generated and may contain inaccuracies. Always verify critical information against official city records.",
  },
  {
    question: "How can I contribute or report a bug?",
    answer:
      "Undervolt is open source under the MIT license. You can file issues, submit pull requests, or star the repo on GitHub at github.com/urbangrowthdgxatx/undervolt. For general feedback, use our contact page.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    const opening = openIndex !== i;
    setOpenIndex(opening ? i : null);
    if (opening) {
      trackEvent("faq_toggle", { question: FAQ_ITEMS[i].question });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">
              FAQ
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mt-4">
              Frequently Asked Questions
            </h1>
            <p className="text-white/40 mt-3">
              Everything you need to know about Undervolt
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-white font-medium pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-5">
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
