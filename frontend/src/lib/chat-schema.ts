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

export const StoryBlockSchema = z.object({
  id: z.string().describe('Unique ID for this story block (e.g., "resilience-gap-1")'),
  headline: z.string().describe('Short punchy headline, 3-6 words (e.g., "Resilience is Wealth")'),
  insight: z.string().describe('The key insight with **bold** stats, 1-2 sentences'),
  dataPoint: DataPointSchema.nullable().optional().describe('One key statistic to highlight'),
  connectsTo: z.array(z.string()).nullable().optional().describe('IDs of other story blocks this insight connects to'),
  connectionReason: z.string().nullable().optional().describe('Why this connects to those blocks (e.g., "both reveal infrastructure gaps")'),
  isTheme: z.boolean().nullable().optional().describe('True if this is a synthesized theme combining multiple insights'),
});

export const ChatResponseSchema = z.object({
  message: z.string().describe('Response text with **bold** for emphasis on key statistics'),
  storyBlock: StoryBlockSchema.nullable().optional().describe('If this insight is story-worthy, include a story block to add to the narrative'),
});

export type SignalType = z.infer<typeof SignalTypeSchema>;
export type ViewMode = z.infer<typeof ViewModeSchema>;
export type ChartDataItem = z.infer<typeof ChartDataItemSchema>;
export type DistrictDataItem = z.infer<typeof DistrictDataItemSchema>;
export type DataPoint = z.infer<typeof DataPointSchema>;
export type StoryBlock = z.infer<typeof StoryBlockSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
