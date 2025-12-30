import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AUSTIN_CONTEXT } from '@/lib/chat-context';
import { MODE_CONFIG, DEFAULT_QUESTIONS, type Mode } from '@/lib/modes';

export const maxDuration = 30;

const MODE_QUESTION_GUIDANCE: Record<Mode, string> = {
  scout: `Generate SCOUT questions that:
- Surface anomalies and outliers ("What's weird about...")
- Find surprising patterns ("Where do we see unexpected...")
- Cast a wide net ("What else is happening in...")`,
  investigator: `Generate INVESTIGATOR questions that:
- Test hypotheses ("Is there a correlation between...")
- Compare cohorts ("How does X compare to Y...")
- Drill into causation ("Why does X have more...")`,
  editor: `Generate EDITOR questions that:
- Frame narrative structure ("What's the headline for...")
- Find story elements ("Where's the tension in...")
- Connect themes ("How do these insights connect...")`,
};

export async function POST(req: Request) {
  try {
    const { blocks, mode = 'scout' } = await req.json();
    const modeConfig = MODE_CONFIG[mode as Mode] || MODE_CONFIG.scout;
    const modeGuidance = MODE_QUESTION_GUIDANCE[mode as Mode] || MODE_QUESTION_GUIDANCE.scout;

    if (!blocks || !Array.isArray(blocks)) {
      return Response.json({ questions: DEFAULT_QUESTIONS[mode as Mode] || DEFAULT_QUESTIONS.scout });
    }

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        questions: z.array(z.string()).describe('20-28 short follow-up questions'),
        reasoning: z.string().optional().describe('Why these questions fit the current mode'),
      }),
      system: `You are helping users explore Austin through 1.2 million construction permits.

Current mode: **${modeConfig.label}** - ${modeConfig.description}

${AUSTIN_CONTEXT}

${modeGuidance}

Based on their story so far, generate 20-28 VERY SHORT questions (under 6 words each) that:
1. Fit the ${modeConfig.label} mode's style
2. Fill gaps in their narrative
3. Build on what they've found`,
      prompt: blocks.length === 0
        ? `The user has no insights yet. Suggest starting ${modeConfig.label} questions.`
        : `Current story insights:\n${blocks.map((b: { headline: string; insight: string }) => `- ${b.headline}: ${b.insight}`).join('\n')}`,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Suggestion error:', error);
    const mode = 'scout';
    return Response.json({
      questions: DEFAULT_QUESTIONS[mode]
    });
  }
}
