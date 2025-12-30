export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length < 2) {
      return Response.json({ error: 'Need at least 2 blocks to synthesize' }, { status: 400 });
    }

    const ollamaUrl = process.env.VLLM_BASE_URL?.replace('/v1', '') || 'http://localhost:11434';
    const modelName = process.env.VLLM_MODEL_NAME || 'llama3.2:3b';

    // Build summary of blocks
    const blockSummary = blocks.map((b: any, i: number) =>
      `${i+1}. ${b.headline}: ${b.insight}`
    ).join('\n');

    const prompt = `Synthesize these Austin permit insights into ONE overarching theme:

${blockSummary}

Create a meta-insight that connects all these findings. Respond with ONLY a JSON object with this structure:
{
  "id": "synth-<timestamp>",
  "headline": "The Theme Title",
  "insight": "2-3 sentences explaining the synthesis",
  "dataPoint": {"label": "Key Stat", "value": "Most striking number"},
  "whyStoryWorthy": "meta-pattern",
  "confidence": "high",
  "isTheme": true
}`;

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        keep_alive: '30m',
        options: {
          temperature: 0.7,
          num_predict: 300,
          num_ctx: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.response.trim();

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const synthesis = JSON.parse(jsonMatch[0]);
      synthesis.id = `synth-${Date.now()}`;
      synthesis.isTheme = true;
      synthesis.connectsTo = blocks.map((b: any) => b.id);
      return Response.json(synthesis);
    }

    throw new Error('Failed to parse synthesis response');

  } catch (error) {
    console.error('Synthesis error:', error);
    return Response.json({ error: 'Failed to synthesize' }, { status: 500 });
  }
}
