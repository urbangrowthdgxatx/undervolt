"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, Search, MessageCircle, X, Send, Loader2, Zap } from "lucide-react";
import dynamicImport from 'next/dynamic';
import { clusterMapping } from '@/config/dashboard';
import { CATEGORY_QUESTIONS } from '@/lib/modes';
import type { SignalType } from '@/components/LeafletMap';

// Dynamically import Leaflet map (better performance on Jetson - no WebGL required)
const LeafletMap = dynamicImport(() => import('@/components/LeafletMap').then(mod => ({ default: mod.LeafletMap })), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><div className="text-white/40">Loading map...</div></div>
});

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Stats {
  totalPermits: number;
  dateRange?: { earliest: string; latest: string } | null;
  clusterDistribution: Array<{
    id: number;
    name: string;
    count: number;
    percentage: number;
    keywords?: Array<{ keyword: string; frequency: number }>;
  }>;
  topZips: Array<{
    zip: string;
    count: number;
    solar?: number;
    battery?: number;
    ev_charger?: number;
    generator?: number;
    panel_upgrade?: number;
    hvac?: number;
  }>;
  energyStats: {
    battery: number;
    solar: number;
    panelUpgrade: number;
    generator: number;
    hvac: number;
    evCharger: number;
    solarStats?: {
      total_permits: number;
      with_capacity_data: number;
      avg_capacity_kw: number;
      total_capacity_kw: number;
    };
  };
  llmCategories?: {
    projectType: Array<{ value: string; count: number }>;
    buildingType: Array<{ value: string; count: number }>;
    scale: Array<{ value: string; count: number }>;
    trade: Array<{ value: string; count: number }>;
    totalCategorized: number;
  };
}

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number];
  }

// Simple markdown bold formatter
function formatBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
;
  properties: {
    zip_code: string;
    total_permits: number;
    cluster_id: number;
    cluster_name: string;
    [key: string]: any;
  };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clusterData, setClusterData] = useState<any[]>([]);  // Cluster polygons
  const [individualPermits, setIndividualPermits] = useState<any[]>([]);  // Individual permits
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightZip, setHighlightZip] = useState<string | null>(null);
  const [showEnergyOnly, setShowEnergyOnly] = useState(false);
  const [selectedEnergyType, setSelectedEnergyType] = useState<string | null>(null);

  // Read filter from URL on mount
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      const validFilters = ["solar", "battery", "ev_charger", "generator", "panel_upgrade", "hvac"];
      if (validFilters.includes(filter)) {
        setSelectedEnergyType(filter);
        setShowEnergyOnly(true);
      }
    }
  }, [searchParams]);
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Map energy filter values to signal types for LeafletMap
  const getSignalType = (energyType: string | null): string => {
    if (!energyType) return "all";
    const mapping: Record<string, string> = {
      'panel_upgrade': 'panel',
      'ev_charger': 'ev',
      'solar': 'solar',
      'battery': 'battery',
      'generator': 'generator',
      'hvac': 'battery',  // HVAC maps to battery cluster
    };
    return mapping[energyType] || 'all';
  };
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chatSuggestions = CATEGORY_QUESTIONS.generators.slice(0, 1)
    .concat(CATEGORY_QUESTIONS.battery.slice(0, 1))
    .concat(CATEGORY_QUESTIONS.resilience.slice(0, 1))
    .concat(CATEGORY_QUESTIONS.pools.slice(0, 1));

  const formatDateRange = (dateRange: { earliest: string; latest: string } | null | undefined) => {
    if (!dateRange) return null;
    const fmt = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    return `${fmt(dateRange.earliest)} – ${fmt(dateRange.latest)}`;
  };

  const handleChatSubmit = async (message: string) => {
    if (!message.trim() || chatLoading) return;
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(30000),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let responded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const eventMatch = event.match(/^event:\s*(.+)$/m);
          const dataMatch = event.match(/^data:\s*(.+)$/m);
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim();
            if (eventType === 'response') {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.message && !responded) {
                  responded = true;
                  setChatMessages(prev => [...prev, { role: 'assistant', text: parsed.message }]);
                }
              } catch {}
            }
          }
        }
      }
      if (!responded) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'No response received. Try a different question.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I had trouble responding. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Check if search is a zip code (5 digits)
  const isZipSearch = /^\d{5}$/.test(searchQuery.trim());
  
  // Set highlight zip when searching for zip code
  useEffect(() => {
    if (isZipSearch) {
      setHighlightZip(searchQuery.trim());
    } else {
      setHighlightZip(null);
    }
  }, [searchQuery, isZipSearch]);

  // Filter clusters based on search query
  const filteredClusters = stats?.clusterDistribution.filter((cluster) => {
    if (!searchQuery.trim()) return true;
    if (isZipSearch) return true; // Don't filter clusters when searching zip
    const query = searchQuery.toLowerCase();
    return (
      cluster.name.toLowerCase().includes(query) ||
      cluster.keywords?.some((kw: any) => kw.keyword.toLowerCase().includes(query))
    );
  }) || [];

  // Auto-select cluster if search matches exactly one
  useEffect(() => {
    if (searchQuery.trim() && filteredClusters.length === 1) {
      setSelectedCluster(filteredClusters[0].id);
    } else if (!searchQuery.trim()) {
      setSelectedCluster(null);
    }
  }, [searchQuery, filteredClusters.length]);

  useEffect(() => {
    loadStats();
  }, []);

  // Reload permits when filter changes
  useEffect(() => {
    setMapLoading(true);
    loadIndividualPermits(showEnergyOnly, selectedEnergyType, selectedProjectType, selectedBuildingType, selectedTrade).then(async (permits) => {
      // Load cluster boundaries after permits are loaded
      await loadClusterData(permits);
      setMapLoading(false);
    });
  }, [showEnergyOnly, selectedEnergyType, selectedProjectType, selectedBuildingType, selectedTrade]);

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

  // Simple convex hull algorithm (Gift wrapping)
  const computeConvexHull = (points: number[][]): number[][] => {
    if (points.length < 3) return points;

    // Find the leftmost point
    let leftmost = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i][1] < points[leftmost][1] ||
          (points[i][1] === points[leftmost][1] && points[i][0] < points[leftmost][0])) {
        leftmost = i;
      }
    }

    const hull: number[][] = [];
    let current = leftmost;

    do {
      hull.push(points[current]);
      let next = (current + 1) % points.length;

      for (let i = 0; i < points.length; i++) {
        const cross = (points[next][0] - points[current][0]) * (points[i][1] - points[current][1]) -
                     (points[next][1] - points[current][1]) * (points[i][0] - points[current][0]);
        if (cross < 0) next = i;
      }

      current = next;
    } while (current !== leftmost && hull.length < points.length);

    return hull;
  };

  // Load cluster polygon data (for zoomed-out view)
  const loadClusterData = async (permits: any[]) => {
    try {
      console.log('[Dashboard] Loading cluster data, permits available:', permits.length);

      const res = await fetch('/api/geojson');
      const geojson = await res.json();

      // Map cluster IDs to signal types (matching actual ML clusters)
      const clusterToSignal: Record<number, any> = {
        0: 'panel',      // New Residential Construction (green)
        1: 'generator',  // General Construction & Repairs (pink)
        2: 'solar',      // Electrical & Roofing Work (amber)
        4: 'battery',    // HVAC Installations (blue)
        6: 'adu',        // Window Installations & Multi-Trade Remodels (purple)
        7: 'ev',         // Foundation Repairs (indigo)
      };

      // Group permits by cluster to compute boundaries
      const permitsByCluster = new globalThis.Map<number, any[]>();

      permits.forEach(permit => {
        const clusterId = permit.cluster;
        if (!permitsByCluster.has(clusterId)) {
          permitsByCluster.set(clusterId, []);
        }
        permitsByCluster.get(clusterId)!.push([permit.lat, permit.lng]);
      });

      console.log('[Dashboard] Permits grouped by cluster:', permitsByCluster.size, 'clusters');

      // Get cluster names from geojson
      const clusterNames = new globalThis.Map<number, string>();
      geojson.features.forEach((f: GeoJSONFeature) => {
        if (!clusterNames.has(f.properties.cluster_id)) {
          clusterNames.set(f.properties.cluster_id, f.properties.cluster_name);
        }
      });

      // Group by unique cluster type (like Priceline hotel areas)
      const clusterGroups = new globalThis.Map<number, any>();

      geojson.features.forEach((feature: GeoJSONFeature) => {
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];
        const clusterId = feature.properties.cluster_id;
        const totalPermits = feature.properties.total_permits;
        const clusterName = feature.properties.cluster_name;

        if (!clusterGroups.has(clusterId)) {
          // First occurrence of this cluster type
          clusterGroups.set(clusterId, {
            clusterId,
            clusterName,
            totalPermits, // This is already the total count for this cluster
            positions: [[lat, lng]],
          });
        } else {
          // Add position but don't accumulate totalPermits (it's the same for all features in cluster)
          const existing = clusterGroups.get(clusterId);
          existing.positions.push([lat, lng]);
        }
      });

      // Transform to cluster data with averaged positions
      const transformed = Array.from(clusterGroups.values()).map((group) => {
        // Calculate centroid of all positions for this cluster type
        const avgLat = group.positions.reduce((sum: number, p: number[]) => sum + p[0], 0) / group.positions.length;
        const avgLng = group.positions.reduce((sum: number, p: number[]) => sum + p[1], 0) / group.positions.length;

        return {
          id: `cluster-${group.clusterId}`,
          lat: avgLat,
          lng: avgLng,
          signal: clusterToSignal[group.clusterId] || 'all',
          description: group.clusterName,
          zip: '',
          cluster: group.clusterId,
          value: `${group.totalPermits.toLocaleString()} permits`,
          count: group.totalPermits,
          // No boundary - will render as circles with count labels
        };
      }).filter((item: any) => !isNaN(item.lat) && !isNaN(item.lng));

      console.log('[Dashboard] Created cluster data:', transformed.length, 'clusters');
      setClusterData(transformed);
    } catch (error) {
      console.error('Failed to load cluster data:', error);
    }
  };

  // Load individual permits (for zoomed-in view and cluster boundaries)
  const loadIndividualPermits = async (
    energyOnly: boolean = false,
    energyType: string | null = null,
    projectType: string | null = null,
    buildingType: string | null = null,
    trade: string | null = null
  ) => {
    try {
      let url = `/api/permits-detailed?limit=10000`;
      if (energyType) {
        url += `&energyType=${energyType}`;
      } else if (energyOnly) {
        url += '&energyOnly=true';
      }
      if (projectType) url += `&projectType=${projectType}`;
      if (buildingType) url += `&buildingType=${buildingType}`;
      if (trade) url += `&trade=${trade}`;
      const res = await fetch(url);
      const data = await res.json();

      // Map cluster IDs to signal types (matching actual ML clusters)
      const clusterToSignal: Record<string, any> = {
        '0': 'panel',      // New Residential Construction (green)
        '1': 'generator',  // General Construction & Repairs (pink)
        '2': 'solar',      // Electrical & Roofing Work (amber)
        '4': 'battery',    // HVAC Installations (blue)
        '6': 'adu',        // Window Installations & Multi-Trade Remodels (purple)
        '7': 'ev',         // Foundation Repairs (indigo)
      };

      // Debug: Check what cluster fields are available
      if (data.permits.length > 0) {
        console.log('[Dashboard] Sample permit data:', data.permits[0]);
      }

      // Transform individual permits
      const transformed = data.permits
        .map((permit: any, index: number) => ({
          id: permit.permitNumber || permit.permit_id || `permit-${index}`,
          lat: parseFloat(permit.latitude),
          lng: parseFloat(permit.longitude),
          signal: clusterToSignal[permit.clusterId ?? permit.f_cluster ?? permit.cluster_id] || 'all',
          description: permit.workDescription || permit.permit_type_desc || permit.work_class || 'Permit',
          zip: permit.zipCode || permit.zip_code || '',
          cluster: parseInt(permit.clusterId ?? permit.f_cluster ?? permit.cluster_id ?? '0'),
          value: permit.total_job_valuation ? `$${parseFloat(permit.total_job_valuation).toLocaleString()}` : undefined,
          year: permit.year_issued,
        }))
        .filter((item: any) => !isNaN(item.lat) && !isNaN(item.lng));

      // Debug: Check cluster distribution
      const clusterCounts = new globalThis.Map<number, number>();
      transformed.forEach((p: any) => {
        clusterCounts.set(p.district, (clusterCounts.get(p.district) || 0) + 1);
      });
      console.log('[Dashboard] Cluster distribution:', Array.from(clusterCounts.entries()));

      setIndividualPermits(transformed);
      return transformed; // Return the data so it can be used by loadClusterData
    } catch (error) {
      console.error('Failed to load individual permits:', error);
      return []; // Return empty array on error
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black pt-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading infrastructure data...</p>
          <p className="text-white/30 text-sm mt-2">First load takes ~10s (processing 2.3M permits)</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-screen flex items-center justify-center bg-black pt-16">
        <div className="text-center">
          <p className="text-white/40">Failed to load data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black pt-14 md:pt-16 overflow-hidden">
      {/* Search Bar and Filters */}
      <div className="bg-black border-b border-white/5 px-3 md:px-6 py-2 md:py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-full text-sm md:text-base text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          {/* Energy Only Toggle */}
          <button
            onClick={() => setShowEnergyOnly(!showEnergyOnly)}
            className={`px-3 md:px-4 py-2 md:py-3 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
              showEnergyOnly
                ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                : 'bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-white/15'
            }`}
          >
            {showEnergyOnly ? '⚡' : 'All'}
            <span className="hidden md:inline"> {showEnergyOnly ? 'Energy' : 'Permits'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Stats (hidden on mobile) */}
        <div className="hidden md:block w-80 border-r border-white/5 bg-black overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="pb-4 border-b border-white/10">
              <h1 className="text-lg font-medium text-white/90">Austin Infrastructure</h1>
              <p className="text-xs text-white/50 mt-1">Energy infrastructure & construction activity</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stats.totalPermits.toLocaleString()}</span>
                <span className="text-xs text-white/40">total permits</span>
              </div>
              {stats.dateRange && (
                <p className="text-xs text-white/40 mt-1">{formatDateRange(stats.dateRange)}</p>
              )}
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">
                Energy Permits
                {selectedEnergyType && (
                  <button
                    onClick={() => setSelectedEnergyType(null)}
                    className="ml-2 text-white/60 hover:text-white"
                  >
                    ✕ Clear
                  </button>
                )}
              </h3>
              <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'solar' ? null : 'solar')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'solar'
                    ? 'bg-amber-500/30 border-2 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                <p className="text-lg font-semibold text-amber-400">{stats.energyStats.solar.toLocaleString()}</p>
                <p className="text-[10px] text-white/50">Solar</p>
              </button>
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'battery' ? null : 'battery')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'battery'
                    ? 'bg-blue-500/30 border-2 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                }`}
              >
                <p className="text-lg font-semibold text-blue-400">{stats.energyStats.battery.toLocaleString()}</p>
                <p className="text-[10px] text-white/50">Battery</p>
              </button>
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'ev_charger' ? null : 'ev_charger')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'ev_charger'
                    ? 'bg-indigo-500/30 border-2 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40'
                }`}
              >
                <p className="text-lg font-semibold text-indigo-400">{stats.energyStats.evCharger.toLocaleString()}</p>
                <p className="text-[10px] text-white/50">EV</p>
              </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'hvac' ? null : 'hvac')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'hvac'
                    ? 'bg-white/20 border-2 border-white/60 ring-2 ring-white/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <p className="text-lg font-semibold text-white/80">{stats.energyStats.hvac.toLocaleString()}</p>
                <p className="text-[10px] text-white/40">HVAC</p>
              </button>
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'panel_upgrade' ? null : 'panel_upgrade')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'panel_upgrade'
                    ? 'bg-white/20 border-2 border-white/60 ring-2 ring-white/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <p className="text-lg font-semibold text-white/80">{stats.energyStats.panelUpgrade.toLocaleString()}</p>
                <p className="text-[10px] text-white/40">Panel</p>
              </button>
              <button
                onClick={() => setSelectedEnergyType(selectedEnergyType === 'generator' ? null : 'generator')}
                className={`rounded-lg p-3 text-center transition-all ${
                  selectedEnergyType === 'generator'
                    ? 'bg-white/20 border-2 border-white/60 ring-2 ring-white/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <p className="text-lg font-semibold text-white/80">{stats.energyStats.generator.toLocaleString()}</p>
                <p className="text-[10px] text-white/40">Generator</p>
              </button>
              </div>
            </div>

            {/* LLM Categories Section */}
            {stats.llmCategories && stats.llmCategories.totalCategorized > 0 && (
              <>
                <div className="border-t border-white/10" />
                <div>
                  <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>LLM Analysis</span>
                    <span className="text-white/30">{stats.llmCategories.totalCategorized.toLocaleString()} analyzed</span>
                  </h3>

                  {/* Project Type */}
                  <div className="mb-3">
                    <p className="text-[9px] text-white/30 mb-1">Project Type</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.llmCategories.projectType.slice(0, 4).map((pt) => (
                        <button
                          key={pt.value}
                          onClick={() => setSelectedProjectType(selectedProjectType === pt.value ? null : pt.value)}
                          className={`px-2 py-1 rounded text-[10px] transition-all ${
                            selectedProjectType === pt.value
                              ? 'bg-cyan-500/30 border border-cyan-500 text-cyan-300'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                          }`}
                        >
                          {pt.value.replace(/_/g, ' ')}
                          <span className="ml-1 text-white/30">{pt.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Building Type */}
                  <div className="mb-3">
                    <p className="text-[9px] text-white/30 mb-1">Building Type</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.llmCategories.buildingType.slice(0, 4).map((bt) => (
                        <button
                          key={bt.value}
                          onClick={() => setSelectedBuildingType(selectedBuildingType === bt.value ? null : bt.value)}
                          className={`px-2 py-1 rounded text-[10px] transition-all ${
                            selectedBuildingType === bt.value
                              ? 'bg-purple-500/30 border border-purple-500 text-purple-300'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                          }`}
                        >
                          {bt.value.replace(/_/g, ' ')}
                          <span className="ml-1 text-white/30">{bt.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trade */}
                  <div>
                    <p className="text-[9px] text-white/30 mb-1">Trade</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.llmCategories.trade.slice(0, 6).map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setSelectedTrade(selectedTrade === t.value ? null : t.value)}
                          className={`px-2 py-1 rounded text-[10px] transition-all ${
                            selectedTrade === t.value
                              ? 'bg-orange-500/30 border border-orange-500 text-orange-300'
                              : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                          }`}
                        >
                          {t.value}
                          <span className="ml-1 text-white/30">{t.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear LLM filters */}
                  {(selectedProjectType || selectedBuildingType || selectedTrade) && (
                    <button
                      onClick={() => {
                        setSelectedProjectType(null);
                        setSelectedBuildingType(null);
                        setSelectedTrade(null);
                      }}
                      className="mt-2 text-[10px] text-white/40 hover:text-white/60"
                    >
                      Clear LLM filters
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Cluster List */}
            <div>
              <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers size={12} />
                Clusters
                {searchQuery && (
                  <span className="text-[10px] text-white/40">({filteredClusters.length})</span>
                )}
              </h3>
              <div className="space-y-1">
                {filteredClusters.map((cluster) => {
                  // Map cluster ID to color (matching map visualization)
                  const clusterColors: Record<number, string> = {
                    0: '#10b981',  // Green - New Residential Construction
                    1: '#ec4899',  // Pink - General Construction & Repairs
                    2: '#f59e0b',  // Amber - Electrical & Roofing Work
                    4: '#3b82f6',  // Blue - HVAC Installations
                    6: '#a855f7',  // Purple - Window Installations
                    7: '#6366f1',  // Indigo - Foundation Repairs
                  };
                  const color = clusterColors[cluster.id] || '#6b7280';
                  const isExpanded = selectedCluster === cluster.id;

                  return (
                    <div key={cluster.id} className="group">
                      <button
                        onClick={() => setSelectedCluster(cluster.id === selectedCluster ? null : cluster.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white/15 border border-white/30 shadow-lg'
                            : 'hover:bg-white/8 border border-transparent hover:border-white/10'
                        }`}
                        style={{
                          boxShadow: isExpanded ? `0 0 20px ${color}20` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-full flex-shrink-0 transition-all duration-300 ${
                              isExpanded
                                ? 'w-4 h-4 shadow-lg scale-125'
                                : 'w-2.5 h-2.5 group-hover:w-3 group-hover:h-3 group-hover:scale-110'
                            }`}
                            style={{
                              backgroundColor: color,
                              boxShadow: isExpanded ? `0 0 12px ${color}90, 0 0 24px ${color}40` : undefined,
                            }}
                          />
                          <span className={`text-xs flex-1 transition-colors duration-200 ${
                            isExpanded ? 'text-white font-medium' : 'text-white/80 group-hover:text-white/95'
                          }`}>
                            {cluster.name}
                          </span>
                          <span className={`text-[10px] transition-colors duration-200 ${
                            isExpanded ? 'text-white/60' : 'text-white/40 group-hover:text-white/50'
                          }`}>
                            {cluster.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </button>

                      {/* Expanded keywords with animation */}
                      {isExpanded && cluster.keywords && (
                        <div className="ml-7 mt-1.5 mb-2 px-3 py-2 bg-white/8 rounded-lg text-[10px] border border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
                          {cluster.keywords.slice(0, 3).map((kw: any, idx: number) => (
                            <span key={kw.keyword} className="text-white/70">
                              {kw.keyword}
                              {idx < 2 && (cluster.keywords?.length || 0) > idx + 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Map */}
        <div className="flex-1 relative">
          <LeafletMap
                  key={`map-${selectedEnergyType || "all"}`}
                  filter={getSignalType(selectedEnergyType) as SignalType}
                  highlightZip={highlightZip || undefined}
            clusterData={clusterData}
            individualPermits={individualPermits}
            highlightCluster={selectedCluster ?? undefined}
            showLegend={false}
            onClusterClick={(clusterId) => {
              setSelectedCluster(clusterId === selectedCluster ? null : clusterId);
            }}
            clusterMeta={stats.clusterDistribution.map((c) => {
              const clusterColors: Record<number, string> = {
                0: '#10b981',  // Green
                1: '#ec4899',  // Pink
                2: '#f59e0b',  // Amber
                4: '#3b82f6',  // Blue
                6: '#a855f7',  // Purple
                7: '#6366f1',  // Indigo
              };
              return {
                id: c.id,
                name: c.name,
                color: clusterColors[c.id] || '#6b7280',
              };
            })}
            className="w-full h-full"
          />

          {/* Map Loading Overlay */}
          {mapLoading && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white/60 font-medium">Loading infrastructure data...</p>
                <p className="text-white/30 text-xs mt-2">Rendering permit clusters</p>
              </div>
            </div>
          )}

          {/* Floating Selected Cluster Info */}
          {selectedCluster !== null && (
            <div className="absolute top-2 left-2 right-2 md:right-auto md:top-4 md:left-4 bg-black/90 backdrop-blur-md border border-white/30 rounded-xl p-3 md:p-4 md:max-w-sm shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-lg"
                    style={{
                      backgroundColor: stats.clusterDistribution.find(c => c.id === selectedCluster)
                        ? (() => {
                            const clusterColors: Record<number, string> = {
                              0: '#10b981', 1: '#ec4899', 2: '#f59e0b',
                              4: '#3b82f6', 6: '#a855f7', 7: '#6366f1',
                            };
                            return clusterColors[selectedCluster] || '#6b7280';
                          })()
                        : '#6b7280',
                    }}
                  />
                  <h4 className="text-sm font-medium text-white">
                    {stats.clusterDistribution.find(c => c.id === selectedCluster)?.name || `Cluster ${selectedCluster}`}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-white/40 hover:text-white/80 hover:bg-white/10 rounded p-1 transition-all duration-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-white/60">
                {stats.clusterDistribution.find(c => c.id === selectedCluster)?.count.toLocaleString()} permits
                <span className="text-white/40 ml-1">
                  ({stats.clusterDistribution.find(c => c.id === selectedCluster)?.percentage.toFixed(1)}%)
                </span>
              </p>
            </div>
          )}

          {/* Total Permits Badge - adjusted for mobile */}
          <div className="absolute bottom-20 md:bottom-4 right-4 flex flex-col items-end gap-2">
            <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-xl">
              <p className="text-xs md:text-sm text-white/70">
                <span className="font-semibold text-white">{stats.totalPermits.toLocaleString()}</span> permits
              </p>
            </div>
            {/* NVIDIA Jetson Badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Powered by Jetson AGX Orin
            </div>
          </div>

          {/* Chat Toggle Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`absolute bottom-20 md:bottom-4 left-4 backdrop-blur-md border rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-xl flex items-center gap-2 transition-all ${
              showChat
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-black/70 border-white/20 text-white/70 hover:text-white hover:border-white/40'
            }`}
          >
            <MessageCircle size={16} />
            <span className="text-xs md:text-sm">Chat</span>
          </button>

          {/* Mobile Stats Toggle Button */}
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 shadow-xl flex items-center gap-2"
          >
            <Layers size={16} className="text-white/60" />
            <span className="text-sm text-white">Stats</span>
            <span className="text-xs text-white/40">{showMobilePanel ? '▼' : '▲'}</span>
          </button>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="hidden md:flex w-96 border-l border-white/10 bg-black/80 backdrop-blur-md flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">Ask about Austin permits</h3>
              <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && !chatLoading && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-sm text-white/40 mb-4">Ask questions about the permit data</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {chatSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleChatSubmit(s)}
                        className="px-3 py-1.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white/70 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 border border-white/10 text-white/80'
                  }`}>
                    {formatBold(msg.text)}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    <span className="text-[10px] text-white/40">Running on Jetson AGX Orin...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-white/20">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(chatInput); } }}
                  placeholder="Ask about permits..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                />
                <button
                  onClick={() => handleChatSubmit(chatInput)}
                  disabled={!chatInput.trim() || chatLoading}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chatInput.trim() && !chatLoading
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'text-white/20'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Panel */}
        {showMobilePanel && (
          <div className="md:hidden absolute bottom-16 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/20 max-h-[60vh] overflow-y-auto z-50">
            <div className="p-4 space-y-4">
              {/* Header with close button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Austin Permits</h2>
                  <p className="text-2xl font-bold text-white">{stats.totalPermits.toLocaleString()}</p>
                  {stats.dateRange && (
                    <p className="text-xs text-white/40">{formatDateRange(stats.dateRange)}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowMobilePanel(false)}
                  className="p-2 text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Energy Stats Grid */}
              <div>
                <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Energy Permits</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'solar' ? null : 'solar'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'solar' ? 'bg-amber-500/30 border-2 border-amber-500' : 'bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <p className="text-base font-semibold text-amber-400">{stats.energyStats.solar.toLocaleString()}</p>
                    <p className="text-[10px] text-white/50">Solar</p>
                  </button>
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'battery' ? null : 'battery'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'battery' ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-blue-500/10 border border-blue-500/20'
                    }`}
                  >
                    <p className="text-base font-semibold text-blue-400">{stats.energyStats.battery.toLocaleString()}</p>
                    <p className="text-[10px] text-white/50">Battery</p>
                  </button>
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'ev_charger' ? null : 'ev_charger'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'ev_charger' ? 'bg-indigo-500/30 border-2 border-indigo-500' : 'bg-indigo-500/10 border border-indigo-500/20'
                    }`}
                  >
                    <p className="text-base font-semibold text-indigo-400">{stats.energyStats.evCharger.toLocaleString()}</p>
                    <p className="text-[10px] text-white/50">EV</p>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'hvac' ? null : 'hvac'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'hvac' ? 'bg-white/20 border-2 border-white/60' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-base font-semibold text-white/80">{stats.energyStats.hvac.toLocaleString()}</p>
                    <p className="text-[10px] text-white/40">HVAC</p>
                  </button>
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'panel_upgrade' ? null : 'panel_upgrade'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'panel_upgrade' ? 'bg-white/20 border-2 border-white/60' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-base font-semibold text-white/80">{stats.energyStats.panelUpgrade.toLocaleString()}</p>
                    <p className="text-[10px] text-white/40">Panel</p>
                  </button>
                  <button
                    onClick={() => { setSelectedEnergyType(selectedEnergyType === 'generator' ? null : 'generator'); setShowMobilePanel(false); }}
                    className={`rounded-lg p-2 text-center transition-all ${
                      selectedEnergyType === 'generator' ? 'bg-white/20 border-2 border-white/60' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-base font-semibold text-white/80">{stats.energyStats.generator.toLocaleString()}</p>
                    <p className="text-[10px] text-white/40">Generator</p>
                  </button>
                </div>
              </div>

              {/* Clusters */}
              <div>
                <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Clusters</h3>
                <div className="grid grid-cols-2 gap-2">
                  {filteredClusters.slice(0, 6).map((cluster) => {
                    const clusterColors: Record<number, string> = {
                      0: '#10b981', 1: '#ec4899', 2: '#f59e0b',
                      4: '#3b82f6', 6: '#a855f7', 7: '#6366f1',
                    };
                    const color = clusterColors[cluster.id] || '#6b7280';
                    return (
                      <button
                        key={cluster.id}
                        onClick={() => { setSelectedCluster(cluster.id === selectedCluster ? null : cluster.id); setShowMobilePanel(false); }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                          selectedCluster === cluster.id ? 'bg-white/15 border border-white/30' : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs text-white/80 truncate flex-1">{cluster.name}</span>
                        <span className="text-[10px] text-white/40">{cluster.percentage.toFixed(0)}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear filters */}
              {(selectedEnergyType || selectedCluster) && (
                <button
                  onClick={() => { setSelectedEnergyType(null); setSelectedCluster(null); }}
                  className="w-full py-2 text-sm text-white/60 border border-white/20 rounded-lg"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Chat Overlay */}
        {showChat && (
          <div className="md:hidden fixed inset-0 z-[60] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">Ask about Austin permits</h3>
              <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && !chatLoading && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-sm text-white/40 mb-4">Ask questions about the permit data</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {chatSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleChatSubmit(s)}
                        className="px-3 py-1.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white/70 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 border border-white/10 text-white/80'
                  }`}>
                    {formatBold(msg.text)}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    <span className="text-[10px] text-white/40">Running on Jetson AGX Orin...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 pb-safe">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-white/20">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(chatInput); } }}
                  placeholder="Ask about permits..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                />
                <button
                  onClick={() => handleChatSubmit(chatInput)}
                  disabled={!chatInput.trim() || chatLoading}
                  className={`p-1.5 rounded-lg transition-colors ${
                    chatInput.trim() && !chatLoading
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'text-white/20'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-black pt-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
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
