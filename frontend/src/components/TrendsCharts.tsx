"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrendsData {
  monthly_trends: Array<{ year_month: string; total_permits: number }>;
  cluster_trends: Array<any>;
  growth_rates: Array<{
    cluster_id: number;
    years: number[];
    permits: number[];
    cagr: number;
    total_growth: number;
  }>;
  seasonal_patterns: Array<{ month: number; avg_permits: number }>;
}

export default function TrendsCharts() {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'monthly' | 'clusters' | 'seasonal'>('monthly');

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      setTrends(data);
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="p-8 text-center text-white/50">
        No trends data available
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedView('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === 'monthly'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Monthly Trends
        </button>
        <button
          onClick={() => setSelectedView('clusters')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === 'clusters'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Cluster Growth
        </button>
        <button
          onClick={() => setSelectedView('seasonal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === 'seasonal'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Seasonal Patterns
        </button>
      </div>

      {/* Monthly Trends Chart */}
      {selectedView === 'monthly' && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity size={20} />
            Permit Volume Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends.monthly_trends}>
              <defs>
                <linearGradient id="permitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="year_month"
                stroke="#ffffff60"
                tick={{ fill: '#ffffff60', fontSize: 12 }}
                tickFormatter={(value) => {
                  // Show only every 6th month for readability
                  const index = trends.monthly_trends.findIndex(d => d.year_month === value);
                  return index % 6 === 0 ? value : '';
                }}
              />
              <YAxis stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Area
                type="monotone"
                dataKey="total_permits"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#permitGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cluster Growth Rates */}
      {selectedView === 'clusters' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-4">Growth Rates by Cluster (CAGR)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.growth_rates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="cluster_id"
                  stroke="#ffffff60"
                  tick={{ fill: '#ffffff60', fontSize: 12 }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'CAGR']}
                />
                <Bar dataKey="cagr" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Growing Clusters Cards */}
          <div className="grid grid-cols-3 gap-4">
            {trends.growth_rates.slice(0, 3).map((cluster, i) => (
              <div
                key={cluster.cluster_id}
                className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl font-light text-white">#{i + 1}</div>
                  <div className={`flex items-center gap-1 text-sm ${
                    cluster.cagr > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {cluster.cagr > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {cluster.cagr.toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm text-white/60">Cluster {cluster.cluster_id}</div>
                <div className="text-xs text-white/40 mt-2">
                  {cluster.total_growth > 0 ? '+' : ''}{cluster.total_growth.toFixed(0)}% total growth
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Patterns */}
      {selectedView === 'seasonal' && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-medium text-white mb-4">Average Permits by Month</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.seasonal_patterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="month"
                stroke="#ffffff60"
                tick={{ fill: '#ffffff60', fontSize: 12 }}
                tickFormatter={(month) => monthNames[month - 1]}
              />
              <YAxis stroke="#ffffff60" tick={{ fill: '#ffffff60', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
                labelFormatter={(month) => monthNames[month - 1]}
              />
              <Bar dataKey="avg_permits" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-white/50">
            Based on {trends.monthly_trends.length} months of data across multiple years
          </div>
        </div>
      )}
    </div>
  );
}
