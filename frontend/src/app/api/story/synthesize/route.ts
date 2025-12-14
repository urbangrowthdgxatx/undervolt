import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { StoryBlockSchema } from '@/lib/chat-schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length < 2) {
      return Response.json({ error: 'Need at least 2 blocks to synthesize' }, { status: 400 });
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: StoryBlockSchema,
      system: `You are synthesizing multiple insights about Austin's energy infrastructure into ONE overarching theme.

Given several story blocks, identify the META-INSIGHT - the bigger truth that emerges when you connect them all.

Rules:
- Create a NEW headline that captures the synthesis (not just combining existing headlines)
- The insight should reference the underlying blocks but reveal something NEW
- The dataPoint should highlight the most striking statistic
- Set isTheme: true
- Set connectsTo to include ALL the block IDs being synthesized

Examples of good synthesis:
- Multiple blocks about generators, batteries, solar → Theme: "Austin is Preparing for Grid Independence"
- Blocks about District 10 wealth + freeze response → Theme: "Resilience Has Become a Class Divide"
- Blocks about solar growth + battery lag → Theme: "Generation Outpaces Storage"`,
      prompt: `Synthesize these insights into ONE theme:\n\n${JSON.stringify(blocks, null, 2)}`,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Synthesis error:', error);
    return Response.json({ error: 'Failed to synthesize' }, { status: 500 });
  }
}
