import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { StoryBlockSchema } from '@/lib/chat-schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return Response.json(blocks || []);
    }

    // If only one block, no need to regenerate connections
    if (blocks.length === 1) {
      return Response.json(blocks);
    }

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.array(StoryBlockSchema),
      system: `You are reweaving a story about Austin's energy infrastructure.
A story block was removed. Update the "connection" field for each remaining block (except the first) to create smooth narrative flow.

Rules:
- Keep all headlines unchanged
- Keep all insights unchanged
- Keep all dataPoints unchanged
- Keep all IDs unchanged
- Only update the "connection" field to create narrative flow
- First block should have null/undefined connection
- Each subsequent block's connection should reference or flow from the previous insight`,
      prompt: `Reweave these story blocks:\n${JSON.stringify(blocks, null, 2)}`,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Story regeneration error:', error);
    // Return original blocks if regeneration fails
    const { blocks } = await req.json().catch(() => ({ blocks: [] }));
    return Response.json(blocks);
  }
}
