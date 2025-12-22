"use client";

import { useState, useEffect } from "react";
import { Map, BarChart3, TrendingUp, Zap, Search } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const PermitMap = dynamic(() => import('@/components/PermitMap'), { ssr: false });

interface Stats {
  totalPermits: number;
  clusterDistribution: Array<{
    id: number;
    name: string;
    count: number;
    percentage: number;
  }>;
  topZips: Array<{ zip: string; count: number }>;
  energyStats: {
    solar: number;
    hvac: number;
    electrical: number;
    newConstruction: number;
    remodels: number;
  };
  clusterNames: Record<string, { name: string }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading Austin infrastructure data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <p className="text-white/60">Failed to load data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">Undervolt</h1>
              <p className="text-sm text-white/50">Austin Infrastructure Mapper</p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="text"
                  placeholder="Search by ZIP code, cluster, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-white/30 outline-none w-80"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Stats */}
        <div className="w-80 border-r border-white/10 bg-black/20 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Total Permits */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/50">Total Permits</p>
                  <p className="text-2xl font-light text-white">{stats.totalPermits.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Energy Stats */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Zap size={14} />
                Energy Infrastructure
              </h3>
              <div className="space-y-2">
                <StatRow label="Solar Installations" value={stats.energyStats.solar} total={stats.totalPermits} />
                <StatRow label="HVAC Systems" value={stats.energyStats.hvac} total={stats.totalPermits} />
                <StatRow label="Electrical Work" value={stats.energyStats.electrical} total={stats.totalPermits} />
              </div>
            </div>

            {/* Construction Types */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <TrendingUp size={14} />
                Construction Activity
              </h3>
              <div className="space-y-2">
                <StatRow label="New Construction" value={stats.energyStats.newConstruction} total={stats.totalPermits} />
                <StatRow label="Remodels" value={stats.energyStats.remodels} total={stats.totalPermits} />
              </div>
            </div>

            {/* Cluster Distribution */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3">Permit Clusters</h3>
              <div className="space-y-1">
                {stats.clusterDistribution.map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster.id === selectedCluster ? null : cluster.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedCluster === cluster.id
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{cluster.name}</span>
                      <span className="text-xs text-white/40">{cluster.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${cluster.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/40 mt-1">{cluster.count.toLocaleString()} permits</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Top ZIP Codes */}
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Map size={14} />
                Top ZIP Codes
              </h3>
              <div className="space-y-1">
                {stats.topZips.slice(0, 10).map((zip, i) => (
                  <div key={zip.zip} className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded">
                    <span className="text-xs text-white/60">{zip.zip}</span>
                    <span className="text-xs text-white/40">{zip.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Map */}
        <div className="flex-1 relative">
          <PermitMap selectedCluster={selectedCluster} />

          {/* Floating Legend */}
          {selectedCluster !== null && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">
                  {stats.clusterNames[selectedCluster]?.name || `Cluster ${selectedCluster}`}
                </h4>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-white/60">
                {stats.clusterDistribution.find(c => c.id === selectedCluster)?.count.toLocaleString()} permits
              </p>
            </div>
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/50">Clusters</p>
                <p className="text-xl font-light text-white">{stats.clusterDistribution.length}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">ZIP Codes</p>
                <p className="text-xl font-light text-white">{stats.topZips.length}+</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Solar</p>
                <p className="text-xl font-light text-white">{stats.energyStats.solar.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = (value / total) * 100;

  return (
    <div className="bg-white/5 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/60">{label}</span>
        <span className="text-xs text-white/40">{value.toLocaleString()}</span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
