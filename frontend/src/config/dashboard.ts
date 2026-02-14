// Dashboard configuration - controls what data is displayed and how

export type ViewMode = 'energy' | 'construction' | 'all';

export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
  dbField?: string; // Field name in database (e.g., 'solar', 'battery')
}

export interface ViewConfig {
  id: ViewMode;
  title: string;
  subtitle: string;
  description: string;
  categories: CategoryConfig[];
  // Which clusters to show (null = all)
  clusterFilter?: number[];
  // Stats panel config
  statsTitle: string;
  // Map legend title
  legendTitle: string;
}

// Energy infrastructure categories
const energyCategories: CategoryConfig[] = [
  { id: 'solar', label: 'Solar', color: '#f59e0b', dbField: 'solar' },
  { id: 'battery', label: 'Battery Storage', color: '#3b82f6', dbField: 'battery' },
  { id: 'ev_charger', label: 'EV Charger', color: '#6366f1', dbField: 'ev_charger' },
  { id: 'panel_upgrade', label: 'Panel Upgrade', color: '#10b981', dbField: 'panel_upgrade' },
  { id: 'generator', label: 'Generator', color: '#ec4899', dbField: 'generator' },
  { id: 'hvac', label: 'HVAC', color: '#8b5cf6', dbField: 'hvac' },
];

// Construction type categories (based on ML clusters)
const constructionCategories: CategoryConfig[] = [
  { id: 'general', label: 'General Construction', color: '#ec4899' },
  { id: 'hvac_install', label: 'HVAC Installations', color: '#3b82f6' },
  { id: 'remodel', label: 'Residential Remodels', color: '#a855f7' },
  { id: 'window', label: 'Window & Multi-Trade', color: '#f59e0b' },
  { id: 'foundation', label: 'Foundation Repairs', color: '#6366f1' },
  { id: 'demolition', label: 'Demolition', color: '#ef4444' },
  { id: 'electrical', label: 'Electrical & Roofing', color: '#10b981' },
  { id: 'new_construction', label: 'New Construction', color: '#06b6d4' },
];

// View configurations
export const viewConfigs: Record<ViewMode, ViewConfig> = {
  energy: {
    id: 'energy',
    title: 'Energy Infrastructure',
    subtitle: 'Austin Energy Permits',
    description: 'Solar, battery, EV chargers, and electrical upgrades',
    categories: energyCategories,
    statsTitle: 'AUSTIN ENERGY INFRASTRUCTURE',
    legendTitle: 'ENERGY TYPES',
  },
  construction: {
    id: 'construction',
    title: 'Construction Activity',
    subtitle: 'Austin Building Permits',
    description: 'All construction permits by ML-classified type',
    categories: constructionCategories,
    statsTitle: 'AUSTIN CONSTRUCTION',
    legendTitle: 'PERMIT CLUSTERS',
  },
  all: {
    id: 'all',
    title: 'All Permits',
    subtitle: 'Complete Dataset',
    description: 'All 2.3M construction permits',
    categories: [...energyCategories, ...constructionCategories],
    statsTitle: 'AUSTIN PERMITS',
    legendTitle: 'ALL CATEGORIES',
  },
};

// Default view
export const defaultView: ViewMode = 'energy';

// Map signal types to colors (for LeafletMap compatibility)
export const signalColors: Record<string, { color: string; label: string }> = {
  ev: { color: '#6366f1', label: 'EV Charger' },
  solar: { color: '#f59e0b', label: 'Solar' },
  battery: { color: '#3b82f6', label: 'Battery' },
  adu: { color: '#a855f7', label: 'ADU' },
  generator: { color: '#ec4899', label: 'Generator' },
  panel: { color: '#10b981', label: 'Panel Upgrade' },
  hvac: { color: '#8b5cf6', label: 'HVAC' },
  all: { color: '#6b7280', label: 'All Permits' },
};

// Cluster ID to category mapping
export const clusterMapping: Record<number, { name: string; signal: string }> = {
  0: { name: 'New Residential Construction', signal: 'panel' },
  1: { name: 'General Construction & Repairs', signal: 'generator' },
  2: { name: 'Electrical & Roofing Work', signal: 'solar' },
  3: { name: 'Major Residential Remodels', signal: 'adu' },
  4: { name: 'HVAC Installations', signal: 'hvac' },
  5: { name: 'Demolition Projects', signal: 'all' },
  6: { name: 'Window Installations & Multi-Trade', signal: 'battery' },
  7: { name: 'Foundation Repairs', signal: 'ev' },
};

// Helper to get config for current view
export function getViewConfig(mode: ViewMode): ViewConfig {
  return viewConfigs[mode] || viewConfigs[defaultView];
}

// Helper to get category color
export function getCategoryColor(categoryId: string): string {
  const allCategories = [...energyCategories, ...constructionCategories];
  const category = allCategories.find(c => c.id === categoryId);
  return category?.color || '#6b7280';
}
