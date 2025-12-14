import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AUSTIN_CONTEXT } from '@/lib/chat-context';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks)) {
      return Response.json({ questions: [] });
    }

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        questions: z.array(z.string()).describe('2-3 follow-up questions'),
        reasoning: z.string().describe('Why these questions would deepen the story'),
      }),
      system: `You are analyzing a user's story about Austin's energy infrastructure to suggest what they should explore next.

${AUSTIN_CONTEXT}

Based on the insights they've collected, identify GAPS in their story:
- If they have resilience data but no equity angle, ask about District 4 vs District 10
- If they have post-freeze data but no storage data, ask about batteries
- If they have generation but no demand, ask about EVs or panel upgrades
- If they have 2-3 insights, suggest what would tie them together

Generate 2-3 SHORT questions (under 10 words each) that would:
1. Fill a gap in their narrative
2. Connect existing insights
3. Challenge or deepen what they've found`,
      prompt: blocks.length === 0
        ? 'The user has no insights yet. Suggest starting questions.'
        : `Current story insights:\n${blocks.map((b: { headline: string; insight: string }) => `- ${b.headline}: ${b.insight}`).join('\n')}`,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Suggestion error:', error);
    return Response.json({
      questions: [
        "Who survives blackouts in Austin?",
        "What changed after the 2021 freeze?",
        "Where's the solar-battery gap?",
      ]
    });
  }
}
