"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Layers, Search, MessageCircle, X, Send, Loader2, Zap } from "lucide-react";
import dynamicImport from 'next/dynamic';
import { clusterMapping } from '@/config/dashboard';
import { CATEGORY_QUESTIONS } from '@/lib/modes';
import type { SignalType } from '@/components/LeafletMap';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamically import Leaflet map (better performance on Jetson - no WebGL required)
const LeafletMap = dynamicImport(() => import('@/components/LeafletMap').then(mod => ({ default: mod.LeafletMap })), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><div className="text-white/40">Loading map...</div></div>
});


// Format markdown bold (**text**) to JSX
function formatBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
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
  };
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
  const lastLoadedPermits = useRef<any[]>([]);  // Track last loaded permits for cluster rebuild
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showZipDropdown, setShowZipDropdown] = useState(false);
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
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check if user is signed in
  useEffect(() => {
    try {
      const email = localStorage.getItem("undervolt_user_email");
      if (email) setUserEmail(email);
    } catch {}
  }, []);

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

  const allSuggestions = CATEGORY_QUESTIONS.generators.slice(0, 2)
    .concat(CATEGORY_QUESTIONS.battery.slice(0, 2))
    .concat(CATEGORY_QUESTIONS.resilience.slice(0, 2))
    .concat(CATEGORY_QUESTIONS.pools.slice(0, 2));
  const chatSuggestions = allSuggestions.filter(q => !askedQuestions.has(q)).slice(0, 4);

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
    setAskedQuestions(prev => new Set([...prev, message]));
    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('undervolt_email') : null;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email: userEmail }),
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
      lastLoadedPermits.current = permits;
      // Load cluster boundaries after permits are loaded
      await loadClusterData(permits);
      setMapLoading(false);
    });
  }, [showEnergyOnly, selectedEnergyType, selectedProjectType, selectedBuildingType, selectedTrade]);

  // Rebuild cluster data when stats arrive (fixes race condition: if permits load
  // before stats, cluster counts fall back to ML totals instead of energy totals)
  useEffect(() => {
    if (stats && selectedEnergyType && lastLoadedPermits.current.length > 0) {
      loadClusterData(lastLoadedPermits.current);
    }
  }, [stats]);

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

  // Friendly labels for energy type filters
  const energyTypeLabels: Record<string, string> = {
    solar: 'Solar Installations',
    battery: 'Battery Storage',
    ev_charger: 'EV Chargers',
    generator: 'Generators',
    panel_upgrade: 'Panel Upgrades',
    hvac: 'HVAC',
  };

  // Get the true total for the active energy filter from stats
  const getEnergyTotal = (type: string): number | null => {
    if (!stats) return null;
    const mapping: Record<string, number> = {
      solar: stats.energyStats.solar,
      battery: stats.energyStats.battery,
      ev_charger: stats.energyStats.evCharger,
      generator: stats.energyStats.generator,
      panel_upgrade: stats.energyStats.panelUpgrade,
      hvac: stats.energyStats.hvac,
    };
    return mapping[type] ?? null;
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

        // When an energy type filter is active, use the energy label and true total
        // instead of the ML cluster name (e.g. "Solar Installations" not "Electrical & Roofing Work")
        const displayName = selectedEnergyType
          ? (energyTypeLabels[selectedEnergyType] || group.clusterName)
          : group.clusterName;
        const displayCount = selectedEnergyType
          ? (getEnergyTotal(selectedEnergyType) ?? group.totalPermits)
          : group.totalPermits;

        return {
          id: `cluster-${group.clusterId}`,
          lat: avgLat,
          lng: avgLng,
          signal: clusterToSignal[group.clusterId] || 'all',
          description: displayName,
          zip: '',
          cluster: group.clusterId,
          value: `${displayCount.toLocaleString()} permits`,
          count: displayCount,
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
        clusterCounts.set(p.cluster, (clusterCounts.get(p.cluster) || 0) + 1);
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
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={16} />
            <input
              type="text"
              placeholder="Search zip code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowZipDropdown(e.target.value.length > 0);
              }}
              onFocus={() => setShowZipDropdown(searchQuery.length > 0)}
              onBlur={() => setTimeout(() => setShowZipDropdown(false), 200)}
              className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-full text-sm md:text-base text-white placeholder-white/40 focus:border-white/40 focus:bg-white/15 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowZipDropdown(false); }}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white z-10"
              >
                ✕
              </button>
            )}
            {/* Zip Typeahead Dropdown */}
            {showZipDropdown && stats?.topZips && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/20 rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {stats.topZips
                  .filter(z => z.zip.startsWith(searchQuery))
                  .slice(0, 6)
                  .map(z => (
                    <button
                      key={z.zip}
                      onClick={() => { setSearchQuery(z.zip); setShowZipDropdown(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between"
                    >
                      <span className="text-sm text-white">{z.zip}</span>
                      <span className="text-xs text-white/40">{z.count.toLocaleString()} permits</span>
                    </button>
                  ))}
                {stats.topZips.filter(z => z.zip.startsWith(searchQuery)).length === 0 && (
                  <div className="px-4 py-2 text-sm text-white/40">No matching zip codes</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Stats (hidden on mobile) */}
        <div className="hidden md:block w-64 border-r border-white/5 bg-black/80 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-medium text-white/90">Austin Permits</h1>
                <span className="text-lg font-bold text-white">{stats.totalPermits.toLocaleString()}</span>
              </div>
              {stats.dateRange && (
                <p className="text-[10px] text-white/40 mt-1">{formatDateRange(stats.dateRange)}</p>
              )}
            </div>

            {/* Quick Stats */}
            {/* Energy Infrastructure */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Energy</h3>
                {selectedEnergyType && (
                  <button onClick={() => setSelectedEnergyType(null)} className="text-[10px] text-white/50 hover:text-white">Clear</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'solar', label: 'Solar', count: stats.energyStats.solar, color: 'amber' },
                  { key: 'battery', label: 'Battery', count: stats.energyStats.battery, color: 'blue' },
                  { key: 'ev_charger', label: 'EV', count: stats.energyStats.evCharger, color: 'indigo' },
                  { key: 'generator', label: 'Generator', count: stats.energyStats.generator, color: 'orange' },
                  { key: 'panel_upgrade', label: 'Panel', count: stats.energyStats.panelUpgrade, color: 'purple' },
                  { key: 'hvac', label: 'HVAC', count: stats.energyStats.hvac, color: 'cyan' },
                ].map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedEnergyType(selectedEnergyType === key ? null : key)}
                    className={`rounded-lg p-1.5 text-center transition-all ${
                      selectedEnergyType === key
                        ? `bg-${color}-500/30 border border-${color}-500`
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selectedEnergyType === key ? `text-${color}-400` : 'text-white/70'}`}>{count.toLocaleString()}</p>
                    <p className="text-[9px] text-white/40">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Construction Types — hidden, energy filters only for now */}

            
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

          {/* Total Permits Badge - adjusted for mobile */}
          <div className="absolute bottom-20 md:bottom-4 right-4 flex flex-col items-end gap-2">
            <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-xl">
              <p className="text-xs md:text-sm text-white/70">
                {selectedEnergyType ? (
                  <>
                    <span className="font-semibold text-white">{(getEnergyTotal(selectedEnergyType) ?? 0).toLocaleString()}</span>
                    {' '}{energyTypeLabels[selectedEnergyType] || selectedEnergyType}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">{stats.totalPermits.toLocaleString()}</span> permits
                  </>
                )}
              </p>
            </div>
            {/* NVIDIA Badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Powered by NVIDIA Nemotron
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

        {/* Chat Panel - Floating Overlay */}
        {showChat && (
          <div className="hidden md:flex fixed right-4 top-20 bottom-4 w-80 bg-black/95 backdrop-blur-md rounded-2xl border border-white/10 flex-col z-50 shadow-2xl">
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
                    <span className="text-[10px] text-white/40">Analyzing with Nemotron...</span>
                  </div>
                </div>
              )}
              {/* Suggestions after response */}
              {!chatLoading && chatMessages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
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
              )}

              {/* Initial suggestions when no messages */}
              {!chatLoading && chatMessages.length === 0 && (
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
                  onFocus={() => { if (!userEmail) setShowSignInPrompt(true); }}
                  placeholder={userEmail ? "Ask about permits..." : "Sign in for custom queries..."}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                  readOnly={!userEmail}
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

              {/* Construction clusters — hidden, energy filters only for now */}

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

        {/* Sign In Prompt */}
        {showSignInPrompt && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-white mb-2">Custom Queries</h3>
              <p className="text-sm text-white/60 mb-4">Sign in to ask custom questions about Austin permit data.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="flex-1 px-4 py-2 text-sm text-white/60 border border-white/20 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <a
                  href="/"
                  className="flex-1 px-4 py-2 text-sm text-black bg-white rounded-lg hover:bg-white/90 text-center font-medium"
                >
                  Sign In
                </a>
              </div>
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
                    <span className="text-[10px] text-white/40">Analyzing with Nemotron...</span>
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
                  onFocus={() => { if (!userEmail) setShowSignInPrompt(true); }}
                  placeholder={userEmail ? "Ask about permits..." : "Sign in for custom queries..."}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
                  readOnly={!userEmail}
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
    <ErrorBoundary>
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
    </ErrorBoundary>
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
