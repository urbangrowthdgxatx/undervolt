"use client";

import { useState } from "react";
import { Brain, Layers, Target, Network, Sparkles, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

interface ClusterMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  useCase: string;
  status: "active" | "planned" | "experimental";
}

export default function ClusteringPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>("kmeans");

  const clusterMethods: ClusterMethod[] = [
    {
      id: "kmeans",
      name: "KMeans",
      description: "Partitions data into K clusters by minimizing within-cluster variance. Fast and scalable.",
      icon: <Target className="w-6 h-6" />,
      pros: ["Fast execution", "Scales well", "Easy to interpret", "GPU accelerated with cuML"],
      cons: ["Requires K upfront", "Assumes spherical clusters", "Sensitive to outliers"],
      useCase: "Current production clustering for permit categories",
      status: "active"
    },
    {
      id: "hdbscan",
      name: "HDBSCAN",
      description: "Density-based clustering that automatically finds clusters of varying densities.",
      icon: <Network className="w-6 h-6" />,
      pros: ["No K needed", "Finds arbitrary shapes", "Handles noise", "Identifies outliers"],
      cons: ["Slower than KMeans", "Memory intensive", "Parameter tuning needed"],
      useCase: "Discovering new permit categories automatically",
      status: "planned"
    },
    {
      id: "dbscan",
      name: "DBSCAN",
      description: "Density-based algorithm that groups points in high-density regions.",
      icon: <Layers className="w-6 h-6" />,
      pros: ["No K needed", "Finds arbitrary shapes", "Robust to outliers"],
      cons: ["Sensitive to epsilon", "Struggles with varying density"],
      useCase: "Spatial clustering of permit locations",
      status: "planned"
    },
    {
      id: "spectral",
      name: "Spectral Clustering",
      description: "Uses graph theory to find clusters based on connectivity patterns.",
      icon: <Sparkles className="w-6 h-6" />,
      pros: ["Finds non-convex clusters", "Based on similarity"],
      cons: ["Computationally expensive", "Requires K"],
      useCase: "Finding related permit types by co-occurrence",
      status: "experimental"
    }
  ];

  const currentMethod = clusterMethods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <section className="py-16 px-8 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-4 block">
            Machine Learning
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Clustering Algorithms</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            How we organize 2.3M permits into meaningful categories using GPU-accelerated clustering.
          </p>
        </div>
      </section>

      <section className="py-16 px-8 bg-neutral-900 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Current Pipeline</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl bg-black border border-white/10 text-center">
              <div className="text-blue-400 text-xs font-mono mb-3">01</div>
              <div className="font-medium mb-2">TF-IDF</div>
              <p className="text-white/40 text-sm">Text vectorization</p>
            </div>
            <div className="p-6 rounded-xl bg-black border border-white/10 text-center">
              <div className="text-emerald-400 text-xs font-mono mb-3">02</div>
              <div className="font-medium mb-2">PCA</div>
              <p className="text-white/40 text-sm">Dimensionality reduction</p>
            </div>
            <div className="p-6 rounded-xl bg-black border border-emerald-500/30 text-center">
              <div className="text-emerald-400 text-xs font-mono mb-3">03</div>
              <div className="font-medium mb-2">KMeans</div>
              <p className="text-white/40 text-sm">15 permit categories</p>
            </div>
            <div className="p-6 rounded-xl bg-black border border-white/10 text-center">
              <div className="text-cyan-400 text-xs font-mono mb-3">04</div>
              <div className="font-medium mb-2">Assignment</div>
              <p className="text-white/40 text-sm">Match to centroid</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Algorithm Comparison</h2>
          
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {clusterMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                  selectedMethod === method.id
                    ? "bg-emerald-500 text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {method.icon}
                {method.name}
                {method.status === "active" && <span className="w-2 h-2 bg-emerald-400 rounded-full" />}
              </button>
            ))}
          </div>

          {currentMethod && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    currentMethod.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    currentMethod.status === "planned" ? "bg-blue-500/10 text-blue-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>
                    {currentMethod.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{currentMethod.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      currentMethod.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                      currentMethod.status === "planned" ? "bg-blue-500/20 text-blue-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {currentMethod.status}
                    </span>
                  </div>
                </div>
                <p className="text-white/60 mb-6">{currentMethod.description}</p>
                <div className="p-4 rounded-lg bg-black/50 border border-white/5">
                  <div className="text-xs text-white/40 uppercase mb-2">Use Case</div>
                  <p className="text-white/80">{currentMethod.useCase}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="font-medium text-emerald-400 mb-4">Advantages</h4>
                  <ul className="space-y-2">
                    {currentMethod.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-4">Limitations</h4>
                  <ul className="space-y-2">
                    {currentMethod.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                        <span className="text-red-400">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-8 bg-neutral-900 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">GPU Acceleration with cuML</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            All clustering runs on NVIDIA GPU using cuML from RAPIDS.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-black border border-white/10">
              <div className="text-3xl font-bold text-emerald-400 mb-2">100x</div>
              <div className="text-white/60 text-sm">Faster than CPU</div>
            </div>
            <div className="p-6 rounded-xl bg-black border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">2.3M</div>
              <div className="text-white/60 text-sm">Permits clustered</div>
            </div>
            <div className="p-6 rounded-xl bg-black border border-white/10">
              <div className="text-3xl font-bold text-cyan-400 mb-2">61GB</div>
              <div className="text-white/60 text-sm">GPU memory</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">See It In Action</h2>
          <p className="text-white/60 mb-8">Explore clustered permits on the map.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-medium transition-colors"
          >
            View Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
