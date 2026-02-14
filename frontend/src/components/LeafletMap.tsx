"use client";

import React, { useState, useEffect, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, useMapEvents, CircleMarker, ZoomControl } from "react-leaflet";
import type { LatLngExpression, DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

export type SignalType = "ev" | "solar" | "battery" | "adu" | "generator" | "panel" | "all";

export interface PermitLocation {
  id: string;
  lat: number;
  lng: number;
  signal: SignalType;
  description: string;
  zip: string;
  cluster: number;  // ML cluster ID (0-7)
  value?: string;
  year?: number;
  boundary?: number[][]; // Optional polygon boundary points [lat, lng][]
  count?: number; // Optional count for aggregated clusters
}

// Dark theme color palette - muted, sophisticated tones
const signalConfig: Record<SignalType, { color: string; label: string }> = {
  ev: { color: "#6366f1", label: "EV Charger" },        // Indigo
  solar: { color: "#f59e0b", label: "Solar" },          // Amber
  battery: { color: "#3b82f6", label: "Battery" },      // Blue
  adu: { color: "#a855f7", label: "ADU" },              // Purple
  generator: { color: "#ec4899", label: "Generator" },  // Pink
  panel: { color: "#10b981", label: "Panel Upgrade" },  // Emerald
  all: { color: "#6b7280", label: "All Permits" },      // Dark gray
};

interface ClusterMeta {
  id: number;
  name: string;
  color: string;
}

interface LeafletMapProps {
  clusterData?: PermitLocation[];  // Cluster polygons for zoomed-out view
  individualPermits?: PermitLocation[];  // Individual permits for zoomed-in view
  filter?: SignalType | SignalType[];
  highlightZip?: string;
  highlightCluster?: number;
  className?: string;
  showLegend?: boolean;
  clusterMeta?: ClusterMeta[];  // Cluster metadata for legend
  onClusterClick?: (clusterId: number) => void;  // Callback when cluster is clicked
  loading?: boolean;  // Show loading overlay
  simpleMode?: boolean;  // Show all markers regardless of zoom level
}

// Map recenter component - only centers once on mount
function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();
  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      map.setView(center);
      initialized.current = true;
    }
  }, [center, map]);

  return null;
}

// Zip zoom component - zooms to permits in a zip code
function ZipZoom({ zip, permits }: { zip: string | undefined; permits: PermitLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!zip || permits.length === 0) return;
    
    // Find permits in this zip
    const zipPermits = permits.filter(p => p.zip === zip);
    if (zipPermits.length === 0) return;
    
    // Calculate bounds
    const lats = zipPermits.map(p => p.lat);
    const lngs = zipPermits.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Fly to bounds with padding
    map.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { 
      padding: [50, 50],
      maxZoom: 14,
      duration: 0.5
    });
  }, [zip, permits, map]);
  
  return null;
}

// Zoom tracker component
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export function LeafletMap({
  clusterData = [],
  individualPermits = [],
  filter = "all",
  highlightZip,
  highlightCluster,
  className = "",
  showLegend = true,
  clusterMeta = [],
  onClusterClick,
  loading = false,
  simpleMode = false,
}: LeafletMapProps) {
  const [selectedPermit, setSelectedPermit] = useState<PermitLocation | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [zoom, setZoom] = useState(13);
  const center: LatLngExpression = [30.29, -97.7431]; // Austin center

  // Multi-level zoom thresholds
  const CLUSTER_ZOOM = 13;      // Zoom 10-13: Show ML cluster polygons
  const INDIVIDUAL_ZOOM = 16;   // 16+: Show individual permit markers

  // In simpleMode, always show individual markers
  const showClusters = simpleMode ? false : zoom <= CLUSTER_ZOOM;
  const showGridGroups = simpleMode ? false : (zoom > CLUSTER_ZOOM && zoom < INDIVIDUAL_ZOOM);
  const showIndividuals = simpleMode ? true : zoom >= INDIVIDUAL_ZOOM;

  // Handle cluster click - call parent callback and show popup
  const handleClusterClick = (permit: PermitLocation) => {
    setSelectedPermit(permit);
    if (onClusterClick && permit.cluster !== undefined) {
      onClusterClick(permit.cluster);
    }
  };

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter cluster data
  const filteredClusters = clusterData.filter((p) => {
    if (filter === "all") return true;
    if (Array.isArray(filter)) return filter.includes(p.signal as SignalType);
    return p.signal === filter;
  });

  // Debug logging
  useEffect(() => {
    console.log('[LeafletMap] Zoom:', zoom, 'ShowClusters:', showClusters, 'ClusterData:', clusterData.length, 'FilteredClusters:', filteredClusters.length);
  }, [zoom, showClusters, clusterData.length, filteredClusters.length]);

  // Filter individual permits
  const filteredPermits = individualPermits.filter((p) => {
    if (filter === "all") return true;
    if (Array.isArray(filter)) return filter.includes(p.signal as SignalType);
    return p.signal === filter;
  });

  // Create grid-based groupings for mid-zoom levels (simple spatial clustering)
  const createGridGroups = (permits: PermitLocation[], zoom: number) => {
    // Much larger grid sizes for aggressive grouping
    // Zoom 11: 0.1° (~11km cells) - very large groupings
    // Zoom 12: 0.07° (~7km cells) - large groupings
    // Zoom 13: 0.04° (~4km cells) - medium groupings
    // Zoom 14-15: 0.02° (~2km cells) - smaller groupings
    const gridSize = zoom < 12 ? 0.1 : zoom < 13 ? 0.07 : zoom < 14 ? 0.04 : 0.02;

    const groups = new globalThis.Map<string, PermitLocation[]>();

    permits.forEach(permit => {
      const gridX = Math.floor(permit.lat / gridSize);
      const gridY = Math.floor(permit.lng / gridSize);
      const key = `${gridX},${gridY}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(permit);
    });

    // Convert to aggregated markers with dominant signal type color
    return Array.from(groups.values()).map(group => {
      const avgLat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
      const avgLng = group.reduce((sum, p) => sum + p.lng, 0) / group.length;

      // Find dominant signal type in this group
      const signalCounts: Record<string, number> = {};
      group.forEach(p => {
        const sig = p.signal || 'all';
        signalCounts[sig] = (signalCounts[sig] || 0) + 1;
      });
      
      let dominantSignal = 'all' as SignalType;
      let maxCount = 0;
      Object.entries(signalCounts).forEach(([sig, count]) => {
        if (sig !== 'all' && count > maxCount) {
          dominantSignal = sig as SignalType;
          maxCount = count;
        }
      });

      return {
        id: `grid-${avgLat}-${avgLng}`,
        lat: avgLat,
        lng: avgLng,
        signal: dominantSignal,
        description: `${group.length} permits in this area`,
        zip: '',
        cluster: 0,
        count: group.length,
      };
    });
  };

  const gridGroups = showGridGroups ? createGridGroups(filteredPermits, zoom) : [];


  // Don't render until client-side
  if (!isClient) {
    return (
      <div className={`relative rounded-xl overflow-hidden ${className} flex items-center justify-center bg-black`}>
        <div className="text-white/40">Loading map...</div>
      </div>
    );
  }

  // Highlight logic - only highlight when specifically selected
  const isHighlighted = (permit: PermitLocation) => {
    // If nothing is selected, don't highlight anything
    if (highlightCluster === undefined && !highlightZip) return false;

    // Only highlight if this specific permit matches the selection
    if (highlightCluster !== undefined && highlightCluster !== null) {
      return permit.cluster === highlightCluster;
    }
    if (highlightZip) {
      return permit.zip === highlightZip;
    }
    return false;
  };

  // Create elegant label icon for cluster counts (dark theme)
  const createClusterLabel = (count: number, color: string): DivIcon | undefined => {
    if (typeof window === "undefined") return undefined;

    const L = require("leaflet");

    return new L.DivIcon({
      className: "custom-cluster-label",
      html: `
        <div style="
          background: linear-gradient(135deg, ${color}dd, ${color}aa);
          color: #ffffff;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 20px ${color}40;
          backdrop-filter: blur(4px);
          font-family: system-ui, -apple-system, sans-serif;
          letter-spacing: 0.3px;
        ">${count > 999 ? (count/1000).toFixed(1) + 'k' : count}</div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  };

  // Create label with both count and cluster name inside circle
  const createClusterLabelWithName = (count: number, name: string, color: string, highlighted: boolean = false): DivIcon | undefined => {
    if (typeof window === "undefined") return undefined;

    const L = require("leaflet");
    const displayCount = count > 999 ? (count/1000).toFixed(1) + 'k' : count;
    // Shorten cluster name for display
    const clusterName = name || 'Unknown';
    const shortName = clusterName.length > 18 ? clusterName.substring(0, 16) + '...' : clusterName;
    const size = highlighted ? 84 : 72;

    return new L.DivIcon({
      className: "custom-cluster-label-with-name",
      html: `
        <div style="
          background: linear-gradient(135deg, ${color}${highlighted ? 'ee' : 'dd'}, ${color}${highlighted ? 'cc' : 'aa'});
          color: #ffffff;
          border: ${highlighted ? '3px' : '1.5px'} solid rgba(255,255,255,${highlighted ? '0.6' : '0.3'});
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          box-shadow: ${highlighted
            ? `0 6px 20px rgba(0,0,0,0.8), 0 0 30px ${color}80, 0 0 60px ${color}40`
            : `0 4px 12px rgba(0,0,0,0.6), 0 0 20px ${color}40`};
          backdrop-filter: blur(4px);
          font-family: system-ui, -apple-system, sans-serif;
          transform: ${highlighted ? 'scale(1.1)' : 'scale(1)'};
          transition: all 0.3s ease;
        ">
          <div style="
            font-weight: 700;
            font-size: 18px;
            line-height: 1;
          ">${displayCount}</div>
          <div style="
            font-size: 9px;
            font-weight: 500;
            opacity: 0.9;
            text-align: center;
            padding: 0 6px;
            line-height: 1.1;
            max-width: 64px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${shortName}</div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Create custom marker icon with minimal label
  const createMarkerIcon = (signal: SignalType, highlighted: boolean): DivIcon | undefined => {
    if (typeof window === "undefined") return undefined;

    const L = require("leaflet");
    const config = signalConfig[signal];

    // Get icon emoji based on signal type
    const iconEmoji = {
      ev: "⚡",
      solar: "☀️",
      battery: "🔋",
      adu: "🏠",
      generator: "⚙️",
      panel: "📊",
      all: "📍"
    }[signal];

    return new L.DivIcon({
      className: "custom-marker",
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: ${config.color};
            opacity: ${highlighted ? 0.95 : 0.6};
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">${iconEmoji}</div>
          <div style="
            font-size: 9px;
            font-weight: 500;
            color: #1a1a1a;
            background: rgba(255,255,255,0.95);
            padding: 1px 4px;
            border-radius: 3px;
            white-space: nowrap;
            letter-spacing: 0.3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          ">${config.label}</div>
        </div>
      `,
      iconSize: [80, 45],
      iconAnchor: [40, 14],
    });
  };

  if (!isClient) {
    return (
      <div className={`relative rounded-xl overflow-hidden ${className} flex items-center justify-center bg-black`}>
        <div className="text-white/40">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/60 text-sm">Loading map data...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        {/* Light tiles from CartoDB for better visibility */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <RecenterMap center={center} />
        <ZoomControl position="topright" />
        <ZoomTracker onZoomChange={setZoom} />
        <ZipZoom zip={highlightZip} permits={individualPermits} />

        {/* Cluster polygons (shown when zoomed out) */}
        {showClusters && filteredClusters.map((cluster) => {
          const highlighted = isHighlighted(cluster);
          const config = signalConfig[cluster.signal];

          // Use polygon boundary if available, otherwise fall back to circle
          if (cluster.boundary && cluster.boundary.length > 2) {
            // Sample points for performance (use every Nth point if too many)
            const sampleRate = Math.max(1, Math.floor(cluster.boundary.length / 100));
            const sampledBoundary = cluster.boundary.filter((_: any, i: number) => i % sampleRate === 0);

            return (
              <Polygon
                key={`cluster-${cluster.id}`}
                positions={sampledBoundary as LatLngExpression[]}
                pathOptions={{
                  fillColor: config.color,
                  fillOpacity: highlighted ? 0.20 : 0.08,
                  color: config.color,
                  weight: 2,
                  opacity: highlighted ? 0.7 : 0.4,
                }}
                eventHandlers={{
                  click: () => setSelectedPermit(cluster),
                }}
              >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{cluster.description}</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {cluster.value && <span>{cluster.value}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Zoom in to see permit areas</p>
                </div>
              </Popup>
              </Polygon>
            );
          }
        })}

        {/* Cluster count labels (shown on top of polygons) - skip if no count */}
        {showClusters && filteredClusters.map((cluster) => {
          if (cluster.boundary && cluster.boundary.length > 0) {
            const config = signalConfig[cluster.signal];
            const count = parseInt(cluster.value?.replace(/[^0-9]/g, '') || '0');

            // Don't show label if count is 0
            if (count === 0) return null;

            return (
              <Marker
                key={`label-${cluster.id}`}
                position={[cluster.lat, cluster.lng]}
                icon={createClusterLabel(count, config.color)}
                eventHandlers={{
                  click: () => handleClusterClick(cluster),
                }}
              />
            );
          }
          return null;
        })}

        {/* Cluster markers with count and name labels */}
        {showClusters && filteredClusters.map((cluster) => {
          const highlighted = isHighlighted(cluster);
          const config = signalConfig[cluster.signal];

          if (!cluster.boundary || cluster.boundary.length <= 2) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                position={[cluster.lat, cluster.lng]}
                icon={createClusterLabelWithName(
                  cluster.count || parseInt(cluster.value?.replace(/[^0-9]/g, '') || '0'),
                  cluster.description,
                  config.color,
                  highlighted
                )}
                eventHandlers={{
                  click: () => handleClusterClick(cluster),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {cluster.description}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      {cluster.value && <span>{cluster.value}</span>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}

        {/* Grid-based groupings (shown at mid-zoom) - Elegant dark theme circles */}
        {showGridGroups && gridGroups.map((group: any) => {
          const config = signalConfig[group.signal as SignalType] || signalConfig['all'];
          return (
            <Circle
              key={group.id}
              center={[group.lat, group.lng]}
              radius={Math.min(800, Math.max(200, Math.sqrt(group.count) * 30))}  // Scale by permit count
              pathOptions={{
                fillColor: config.color,
                fillOpacity: 0.5,
                color: config.color,
                weight: 2.5,
                opacity: 0.8,
              }}
            >
              <Popup>
                <div className="p-2 min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium text-gray-900">{config.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{group.count} permits in this area</p>
                  <p className="text-xs text-gray-400 mt-2">Zoom in more to see individual permits</p>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Grid group count labels - centered and clickable */}
        {showGridGroups && gridGroups.map((group: any) => {
          if (group.count === 0) return null;

          const L = typeof window !== "undefined" ? require("leaflet") : null;
          if (!L) return null;

          const icon = new L.DivIcon({
            className: "grid-count-label",
            html: `<div style="
              color: #374151;
              font-weight: 600;
              font-size: 13px;
              text-shadow: 0 0 3px white, 0 0 3px white, 0 0 5px white;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              cursor: pointer;
            ">${group.count > 999 ? (group.count/1000).toFixed(0) + 'k' : group.count}</div>`,
            iconSize: [50, 30],
            iconAnchor: [25, 15],
          });

          return (
            <Marker
              key={`grid-label-${group.id}`}
              position={[group.lat, group.lng]}
              icon={icon}
              eventHandlers={{
                click: () => setSelectedPermit(group),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[140px]">
                  <p className="font-medium text-gray-900">{group.count.toLocaleString()} permits</p>
                  <p className="text-xs text-gray-500 mt-1">in this area</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Individual permit markers (shown when fully zoomed in) */}
        {showIndividuals && filteredPermits.slice(0, 500).map((permit) => {
          const highlighted = isHighlighted(permit);
          return (
            <Marker
              key={permit.id}
              position={[permit.lat, permit.lng]}
              icon={createMarkerIcon(permit.signal, highlighted)}
              eventHandlers={{
                click: () => setSelectedPermit(permit),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: signalConfig[permit.signal].color }}
                    />
                    <span className="font-medium text-gray-900">
                      {signalConfig[permit.signal].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{permit.description}</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{permit.zip}</span>
                    {permit.value && <span>{permit.value}</span>}
                  </div>
                  {permit.year && (
                    <div className="text-xs text-gray-400 mt-1">{permit.year}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend - Show actual cluster names */}
      {showLegend && clusterMeta.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 z-[1000] max-w-xs">
          <p className="text-xs text-white/60 mb-2 uppercase tracking-wide">Permit Clusters</p>
          <div className="flex flex-col gap-1.5">
            {clusterMeta.map((cluster) => (
              <div key={cluster.id} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cluster.color }}
                />
                <span className="text-xs text-white/80">{cluster.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info banner - only show when there's data */}
      {showGridGroups && gridGroups.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded text-xs border border-white/10 z-[1000]">
          📊 {gridGroups.length} permit areas
        </div>
      )}
      {showIndividuals && filteredPermits.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded text-xs border border-white/10 z-[1000]">
          📍 {Math.min(500, filteredPermits.length)} permits
        </div>
      )}
      {(showGridGroups || showIndividuals) && gridGroups.length === 0 && filteredPermits.length === 0 && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white/50 px-3 py-1.5 rounded text-xs border border-white/10 z-[1000]">
          Zoom out or pan to see permits
        </div>
      )}

    </div>
  );
}
