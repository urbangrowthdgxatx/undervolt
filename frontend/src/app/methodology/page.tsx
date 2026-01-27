"use client";

import { Brain, Cpu, Database, GitBranch, Layers, Zap } from "lucide-react";

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
      "Backend: cuDF (GPU-accelerated DataFrame) on NVIDIA Jetson AGX Orin",
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
      "Keywords: residential, commercial, remodel, repair, new, demolition, foundation, roof, window, permit, hvac, electrical, plumbing, mechanical, multi-family, single-family",
      "Method: case-insensitive substring match (GPU-accelerated via cuDF str.contains)",
      "Output: 80 binary feature columns (f_{column}_kw_{keyword})",
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
      "Backend: cuML PCA (GPU) or scikit-learn PCA (CPU fallback)",
    ],
  },
  {
    icon: GitBranch,
    title: "5. KMeans Clustering",
    subtitle: "k=8 clusters, 300 max iterations",
    details: [
      "Algorithm: Lloyd\u2019s KMeans (cuML GPU or scikit-learn CPU)",
      "k=8 chosen to balance granularity vs interpretability",
      "Random state: 42 (reproducible assignments)",
      "Input: 10 PCA components per permit",
    ],
  },
  {
    icon: Cpu,
    title: "6. Cluster Naming",
    subtitle: "Rule-based labeling from keyword prevalence",
    details: [
      "For each cluster: calculate keyword prevalence (% of permits containing keyword)",
      "Rank top 3 keywords by prevalence within each cluster",
      "Apply rule-based naming: e.g., demolition > 35% \u2192 \u201cDemolition Projects\u201d",
      "Result: 8 human-readable categories covering all 2.34M permits",
    ],
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <p className="text-purple-400 text-sm uppercase tracking-widest mb-2">Technical Methodology</p>
          <h1 className="text-4xl font-bold mb-4">ML Clustering Pipeline</h1>
          <p className="text-white/50 text-lg">
            How 2.34M construction permits become 8 named categories using
            GPU-accelerated NLP and unsupervised learning on NVIDIA Jetson AGX Orin.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="mb-16 p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-4 text-white/80">Pipeline Architecture</h2>
          <div className="flex flex-col gap-2">
            {["Raw CSV (2.34M rows)", "Clean & Filter", "NLP Keywords (80 features)", "PCA (10 components)", "KMeans (k=8)", "Named Clusters"].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs text-purple-400 font-mono flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
                <span className="text-sm text-white/70 font-mono">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="space-y-8 mb-16">
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
                {/* Bar */}
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
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-16">
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

        {/* Code snippet */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Core Algorithm</h2>
          <pre className="p-4 rounded-xl bg-[#111] border border-white/10 text-sm overflow-x-auto text-white/70">
            <code>{`# NLP Feature Extraction (GPU-accelerated)
for col in TEXT_COLUMNS:             # 5 text columns
    for kw in NLP_KEYWORDS:          # 16 keywords
        df[f"f_{col}_kw_{kw}"] = (
            df[col].str.contains(kw, regex=False)
            .astype(int)             # 80 binary features
        )

# Clustering Pipeline
X = df[feature_columns]              # 80 features x 2.34M rows
X_scaled = StandardScaler().fit_transform(X)
X_pca = PCA(n_components=10).fit_transform(X_scaled)
labels = KMeans(n_clusters=8, max_iter=300).fit_predict(X_pca)

# Result: each permit assigned to cluster 0-7`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
