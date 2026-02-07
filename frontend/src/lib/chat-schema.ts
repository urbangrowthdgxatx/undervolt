import { z } from 'zod';

export const SignalTypeSchema = z.enum([
  'ev', 'solar', 'battery', 'adu', 'generator', 'panel', 'all'
]);

export const ViewModeSchema = z.enum([
  'points', 'electrification', 'stress', 'resilience', 'paradox', 'equity'
]);

export const ChartDataItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  lastYear: z.number().optional(),
});

export const DistrictDataItemSchema = z.object({
  district: z.number().min(1).max(10).describe('Council District number (1-10)'),
  name: z.string().describe('District name (e.g., "Westlake", "East Austin")'),
  solar: z.number().describe('Solar permit count'),
  ev: z.number().describe('EV charger permit count'),
  battery: z.number().describe('Battery permit count'),
  generator: z.number().describe('Generator permit count'),
  adu: z.number().describe('ADU permit count'),
  panel: z.number().describe('Panel upgrade permit count'),
  totalEnergy: z.number().describe('Total energy permits'),
  totalGrowth: z.number().describe('Total construction permits (all types)'),
  electrificationRate: z.number().describe('Electrification rate: totalEnergy / totalGrowth * 100'),
});

// Story block for the narrative builder
export const DataPointSchema = z.object({
  label: z.string().describe('Label for the stat (e.g., "generators")'),
  value: z.string().describe('The value to display (e.g., "2,151")'),
  context: z.string().optional().describe('Additional context'),
});

// Why an insight is story-worthy
export const StoryWorthyReasonSchema = z.enum([
  'equity-gap',        // Reveals inequality between districts/areas
  'post-freeze-shift', // Shows change after Winter Storm Uri
  'district-disparity', // Notable difference between council districts
  'outlier',           // Unusual or unexpected finding
  'paradox',           // Contradictory or counter-intuitive pattern
  'turning-point',     // Marks a significant change or inflection
]);

// Evidence supporting the insight
export const EvidenceSchema = z.object({
  stat: z.string().describe('The supporting statistic (e.g., "Solar permits +38% since 2021")'),
  source: z.string().describe('Data source (e.g., "2021-2024 permit data")'),
});

// Confidence level
export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

// Geographic context for mini-maps
export const GeoDataSchema = z.object({
  type: z.enum(['district', 'zip', 'comparison']).describe('Type of geographic reference'),
  districts: z.array(z.number().min(1).max(10)).optional().describe('Council district numbers'),
  zips: z.array(z.string()).optional().describe('ZIP codes'),
  signal: SignalTypeSchema.optional().describe('Signal type to highlight'),
});

// Chart data for mini-charts
export const ChartDataSchema = z.object({
  type: z.enum(['bar', 'line']).describe('Chart type'),
  title: z.string().optional().describe('Chart title'),
  data: z.array(ChartDataItemSchema).describe('Chart data points'),
});

// Image data for AI-generated illustrations
export const ImageDataSchema = z.object({
  prompt: z.string().describe('Image generation prompt'),
  style: z.enum(['editorial', 'conceptual', 'diagram']).optional().describe('Image style'),
  imageUrl: z.string().optional().describe('Generated image URL (filled after generation)'),
});

export const StoryBlockSchema = z.object({
  id: z.string().describe('Unique ID for this story block (e.g., "resilience-gap-1")'),
  headline: z.string().describe('Short punchy headline, 3-6 words (e.g., "Resilience is Wealth")'),
  insight: z.string().describe('The key insight with **bold** stats, 1-2 sentences'),
  dataPoint: DataPointSchema.nullable().optional().describe('One key statistic to highlight'),
  // Trust-building fields
  whyStoryWorthy: StoryWorthyReasonSchema.nullable().optional().describe('Why this insight is story-worthy'),
  evidence: z.array(EvidenceSchema).nullable().optional().describe('1-2 supporting stats with sources'),
  confidence: ConfidenceSchema.nullable().optional().describe('Data confidence level'),
  // Geographic context for mini-maps
  geoData: GeoDataSchema.nullable().optional().describe('Geographic context for rendering a mini-map'),
  // Chart data for mini-charts
  chartData: ChartDataSchema.nullable().optional().describe('Chart data for rendering a mini-chart'),
  // Image data for AI-generated illustrations
  imageData: ImageDataSchema.nullable().optional().describe('Image prompt for generating an illustration'),
  // Legacy fields (kept for compatibility)
  connectsTo: z.array(z.string()).nullable().optional().describe('IDs of other story blocks this insight connects to'),
  connectionReason: z.string().nullable().optional().describe('Why this connects to those blocks'),
  isTheme: z.boolean().nullable().optional().describe('True if this is a synthesized theme'),
});

export const ChatResponseSchema = z.object({
  message: z.string().describe('Response text with **bold** for emphasis on key statistics'),
  storyBlock: StoryBlockSchema.nullable().describe('Include a story block ONLY for real data-backed insights. Set to null for errors, failures, or conversational responses.'),
});

export type SignalType = z.infer<typeof SignalTypeSchema>;
export type ViewMode = z.infer<typeof ViewModeSchema>;
export type ChartDataItem = z.infer<typeof ChartDataItemSchema>;
export type DistrictDataItem = z.infer<typeof DistrictDataItemSchema>;
export type DataPoint = z.infer<typeof DataPointSchema>;
export type StoryWorthyReason = z.infer<typeof StoryWorthyReasonSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type GeoData = z.infer<typeof GeoDataSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type ImageData = z.infer<typeof ImageDataSchema>;
export type StoryBlock = z.infer<typeof StoryBlockSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
