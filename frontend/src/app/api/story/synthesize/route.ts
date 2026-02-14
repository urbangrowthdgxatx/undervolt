export const maxDuration = 60;

async function getQuickStats(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/stats`, { cache: 'no-store' });
    if (!res.ok) return '';
    const stats = await res.json();
    const e = stats.energyStats || {};
    return `
REAL DATA (use these exact numbers):
- Total permits: ${(stats.totalPermits || 0).toLocaleString()}
- Solar installations: ${(e.solar || 0).toLocaleString()}
- Battery systems: ${(e.battery || 0).toLocaleString()}
- EV chargers: ${(e.evCharger || 0).toLocaleString()}
- Generators: ${(e.generator || 0).toLocaleString()}
- HVAC permits: ${(e.hvac || 0).toLocaleString()}`;
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { blocks } = await req.json();

    if (!blocks || !Array.isArray(blocks) || blocks.length < 2) {
      return Response.json({ error: 'Need at least 2 blocks to synthesize' }, { status: 400 });
    }

    const ollamaUrl = process.env.VLLM_BASE_URL || 'http://localhost:4000/v1';
    const modelName = process.env.VLLM_MODEL_NAME || 'nemotron-3-nano';

    const realStats = await getQuickStats();

    // Build summary of blocks
    const blockSummary = blocks.map((b: any, i: number) =>
      `${i+1}. ${b.headline}: ${b.insight}`
    ).join('\n');

    const prompt = `Synthesize these Austin permit insights into ONE overarching theme.

CRITICAL: Use ONLY the exact numbers from the VERIFIED DATA below. Do NOT invent or estimate any statistics.

Insights to synthesize:
${blockSummary}

VERIFIED DATA:
${realStats}

Create a meta-insight connecting these findings. For dataPoint, use a REAL number from the verified data above.
Respond with ONLY a JSON object:
{
  "id": "synth-<timestamp>",
  "headline": "Short Theme Title",
  "insight": "2-3 sentences using ONLY numbers from the verified data",
  "dataPoint": {"label": "Key Stat", "value": "Exact number from verified data"},
  "whyStoryWorthy": "meta-pattern",
  "confidence": "high",
  "isTheme": true
}`;

    const llmKey = process.env.LLM_API_KEY;

    const response = await fetch(`${ollamaUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(llmKey && { 'Authorization': `Bearer ${llmKey}` }),
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = (data.choices?.[0]?.message?.content || '').trim();

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const synthesis = JSON.parse(jsonMatch[0]);
        synthesis.id = `synth-${Date.now()}`;
        synthesis.isTheme = true;
        synthesis.connectsTo = blocks.map((b: any) => b.id);
        return Response.json(synthesis);
      } catch (parseErr) {
        console.error('JSON parse failed, using fallback:', parseErr);
      }
    }

    // Fallback: build synthesis from the blocks directly
    console.warn('LLM did not return valid JSON, building fallback synthesis');
    const fallback = {
      id: `synth-${Date.now()}`,
      headline: blocks[0]?.headline || 'Austin Infrastructure Insight',
      insight: blocks.map((b: any) => b.insight?.split('.')[0]).filter(Boolean).join('. ') + '.',
      dataPoint: { label: 'Insights Combined', value: String(blocks.length) },
      whyStoryWorthy: 'meta-pattern',
      confidence: 'medium',
      isTheme: true,
      connectsTo: blocks.map((b: any) => b.id),
    };
    return Response.json(fallback);

  } catch (error) {
    console.error('Synthesis error:', error);
    // Even on total failure, return a minimal synthesis so the UI doesn't lose the card
    return Response.json({
      id: `synth-${Date.now()}`,
      headline: 'Combined Insight',
      insight: 'Multiple data points were analyzed to surface this pattern.',
      whyStoryWorthy: 'meta-pattern',
      confidence: 'low',
      isTheme: true,
    });
  }
}
