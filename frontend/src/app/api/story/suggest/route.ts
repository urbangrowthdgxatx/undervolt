import { MODE_CONFIG, DEFAULT_QUESTIONS, type Mode } from '@/lib/modes';

export const maxDuration = 30;

const MODE_QUESTION_GUIDANCE: Record<Mode, string> = {
  scout: `Generate SCOUT questions that surface anomalies, outliers, and surprising patterns (5-7 words each).`,
  investigator: `Generate INVESTIGATOR questions that test hypotheses, compare cohorts, and drill into causation (5-7 words each).`,
  editor: `Generate EDITOR questions that frame narrative structure, find story elements, and connect themes (5-7 words each).`,
};

export async function POST(req: Request) {
  try {
    const { blocks, mode = 'scout' } = await req.json();
    const modeConfig = MODE_CONFIG[mode as Mode] || MODE_CONFIG.scout;
    const modeGuidance = MODE_QUESTION_GUIDANCE[mode as Mode] || MODE_QUESTION_GUIDANCE.scout;

    if (!blocks || !Array.isArray(blocks)) {
      return Response.json({ questions: DEFAULT_QUESTIONS[mode as Mode] || DEFAULT_QUESTIONS.scout });
    }

    // Build context from existing story
    const storyContext = blocks.length === 0
      ? `No insights yet. Mode: ${modeConfig.label}`
      : blocks.map((b: { headline: string; insight: string }) => `${b.headline}`).join(', ');

    const ollamaUrl = process.env.VLLM_BASE_URL?.replace('/v1', '') || 'http://localhost:11434';
    const modelName = process.env.VLLM_MODEL_NAME || 'llama3.2:3b';

    const prompt = `You are exploring Austin construction permits (2015-2025).
Mode: ${modeConfig.label}
${modeGuidance}

Story so far: ${storyContext}

Generate 20-28 short Austin permit questions (5-7 words each). Focus on:
- ZIP codes, neighborhoods (78701, 78758, etc)
- Permit types (solar, battery, demolition, pools, etc)
- Growth trends and changes over time
- Energy infrastructure
- Disparities and patterns

One question per line, no numbering:`;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        keep_alive: '30m',
        options: {
          temperature: 0.8,
          num_predict: 400,  // Enough for 20-28 questions
          num_ctx: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const questions = data.response
      .trim()
      .split('\n')
      .filter((q: string) => q.trim().length > 0)
      .map((q: string) => q.replace(/^[\d.-]\s*/, '').trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 28);

    return Response.json({ questions });

  } catch (error) {
    console.error('Suggestion error:', error);
    const mode = 'scout';
    return Response.json({
      questions: DEFAULT_QUESTIONS[mode]
    });
  }
}
