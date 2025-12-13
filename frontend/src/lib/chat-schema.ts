import { z } from 'zod';

export const SignalTypeSchema = z.enum([
  'ev', 'solar', 'battery', 'adu', 'generator', 'panel', 'all'
]);

export const ChartDataItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  lastYear: z.number().optional(),
});

export const ChatResponseSchema = z.object({
  message: z.string().describe('Response text with **bold** for emphasis on key statistics'),
  mapFilter: z.union([SignalTypeSchema, z.array(SignalTypeSchema)]).nullable().optional().describe('Signal type(s) to filter the map'),
  highlightZip: z.string().nullable().optional().describe('ZIP code to highlight on map (e.g., "78704")'),
  highlightDistrict: z.number().min(1).max(10).nullable().optional().describe('Council District number to highlight (1-10)'),
  showChart: z.boolean().nullable().optional().describe('Whether to show a chart'),
  chartTitle: z.string().nullable().optional().describe('Title for the chart'),
  chartData: z.array(ChartDataItemSchema).nullable().optional().describe('Data for the chart'),
});

export type SignalType = z.infer<typeof SignalTypeSchema>;
export type ChartDataItem = z.infer<typeof ChartDataItemSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
